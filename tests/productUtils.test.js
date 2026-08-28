import test from 'node:test'
import assert from 'node:assert/strict'

import { DEFAULT_PRODUCT_IMAGE, normalizeProductInput, normalizeProductForDisplay, formatPrice, formatTimestamp } from '../src/productUtils.js'

test('normalizeProductInput preserves upload timestamps and uses a fallback image', () => {
  const uploadedAt = '2026-07-21T10:00:00.000Z'
  const normalized = normalizeProductInput(
    {
      id: '',
      name: '  Glow Tray  ',
      price: '120',
      category: ' Decor ',
      badge: '  ',
      image: '  ',
      description: '  Lovely piece  ',
      material: 'Resin',
      dimensions: '10x10',
      features: 'Gold, glossy',
    },
    { uploadedAt }
  )

  assert.equal(normalized.id.startsWith('product-'), true)
  assert.equal(normalized.name, 'Glow Tray')
  assert.equal(normalized.price, '৳120')
  assert.equal(normalized.category, 'Decor')
  assert.equal(normalized.badge, 'New')
  assert.equal(normalized.image, DEFAULT_PRODUCT_IMAGE)
  assert.equal(normalized.uploadedAt, uploadedAt)
  assert.deepEqual(normalized.features, ['Gold', 'glossy'])
})

test('normalizeProductForDisplay assigns a valid timestamp for legacy products', () => {
  const normalized = normalizeProductForDisplay({
    id: 'legacy-product',
    name: 'Legacy Tray',
    price: '120',
    category: 'Decor',
    features: 'Gold, Glossy',
  })

  const parsedDate = new Date(normalized.uploadedAt)

  assert.equal(Number.isNaN(parsedDate.getTime()), false)
  assert.equal(normalized.uploadedAt.startsWith('20') || normalized.uploadedAt.startsWith('1'), true)
})

test('formatTimestamp falls back to a readable date instead of reporting Not available', () => {
  assert.notEqual(formatTimestamp(undefined), 'Not available')
  assert.notEqual(formatTimestamp('invalid-date'), 'Not available')
})

test('normalizeProductInput preserves image URLs instead of forcing a fallback image', () => {
  const normalized = normalizeProductInput({
    id: '',
    name: 'Glow Tray',
    price: '120',
    category: 'Decor',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    description: 'Lovely piece',
    material: 'Resin',
    dimensions: '10x10',
    features: 'Gold, glossy',
  })

  assert.equal(normalized.image, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80')
})

test('formatPrice normalizes existing currency values without duplicating the prefix', () => {
  assert.equal(formatPrice('120'), '৳120')
  assert.equal(formatPrice('৳120'), '৳120')
  assert.equal(formatPrice('BDT 120'), '৳120')
  assert.equal(formatPrice(''), '৳0')
})
