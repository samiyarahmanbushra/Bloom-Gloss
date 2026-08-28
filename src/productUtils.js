export const DEFAULT_PRODUCT_IMAGE = '/product-fallback.svg'

function normalizeTimestamp(value) {
  if (!value) {
    return new Date().toISOString()
  }

  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return new Date().toISOString()
  }

  return parsedValue.toISOString()
}

function hasUsableImage(rawImage) {
  if (!rawImage || typeof rawImage !== 'string') {
    return false
  }

  return Boolean(rawImage.trim())
}

export function parsePriceNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  const cleanStr = String(value).replace(/[^0-9.]/g, '')
  const num = parseFloat(cleanStr)
  return Number.isNaN(num) ? 0 : num
}

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return '৳0'
  }

  const normalizedValue = String(value).trim()
  if (!normalizedValue) {
    return '৳0'
  }

  const num = parsePriceNumber(normalizedValue)
  if (num > 0) {
    return `৳${num.toLocaleString('en-IN')}`
  }

  const valueWithoutCurrency = normalizedValue
    .replace(/^(USD|BDT|US\$|\$|৳)\s*/i, '')
    .trim()

  return valueWithoutCurrency ? `৳${valueWithoutCurrency}` : '৳0'
}

export function normalizeProductForDisplay(product) {
  const uploadedAt = normalizeTimestamp(product?.uploadedAt || product?.createdAt || product?.updatedAt)
  const rawImage = product?.image || ''
  const trimmedImage = typeof rawImage === 'string' ? rawImage.trim() : ''

  return {
    ...product,
    image: hasUsableImage(trimmedImage) ? trimmedImage : DEFAULT_PRODUCT_IMAGE,
    uploadedAt,
  }
}

export function normalizeProductInput(productForm, existingProduct = null) {
  const trimmedName = productForm.name?.trim() || ''
  const trimmedPrice = productForm.price?.toString().trim() || ''
  const trimmedCategory = productForm.category?.trim() || ''
  const trimmedBadge = productForm.badge?.trim() || 'New'
  const trimmedImage = productForm.image?.trim() || ''
  const trimmedDescription = productForm.description?.trim() || ''
  const trimmedMaterial = productForm.material?.trim() || ''
  const trimmedDimensions = productForm.dimensions?.trim() || ''
  const features = (productForm.features || '')
    .toString()
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean)

  return {
    ...productForm,
    id: productForm.id || `product-${Date.now()}`,
    name: trimmedName,
    price: formatPrice(trimmedPrice),
    category: trimmedCategory,
    badge: trimmedBadge || 'New',
    image: trimmedImage,
    description: trimmedDescription,
    material: trimmedMaterial,
    dimensions: trimmedDimensions,
    features,
    uploadedAt: normalizeTimestamp(existingProduct?.uploadedAt || productForm.uploadedAt || existingProduct?.createdAt || existingProduct?.updatedAt),
  }
}

export function formatTimestamp(value) {
  if (!value) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date())
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date())
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}
