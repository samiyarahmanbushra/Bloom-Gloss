import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ADMIN_SESSION_STORAGE_KEY,
  clearAdminSession,
  createAdminSession,
  persistAdminSession,
  readAdminSession,
} from '../src/adminSession.js'

function createStorage(initial = {}) {
  const store = new Map(Object.entries(initial))

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
    removeItem(key) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
  }
}

test('persisted admin sessions remain valid until they expire', () => {
  const storage = createStorage()
  const session = createAdminSession(1000)

  persistAdminSession(session, storage)

  const restored = readAdminSession(storage, session.expiresAt - 100)

  assert.deepEqual(restored, session)
  assert.equal(storage.getItem(ADMIN_SESSION_STORAGE_KEY), JSON.stringify(session))
})

test('expired admin sessions are treated as invalid and removed', () => {
  const storage = createStorage()
  const session = createAdminSession(1000)

  persistAdminSession(session, storage)

  assert.equal(readAdminSession(storage, session.expiresAt + 1), null)
  assert.equal(storage.getItem(ADMIN_SESSION_STORAGE_KEY), null)
})

test('clearAdminSession removes the stored admin session', () => {
  const storage = createStorage()
  const session = createAdminSession(1000)

  persistAdminSession(session, storage)
  clearAdminSession(storage)

  assert.equal(readAdminSession(storage), null)
  assert.equal(storage.getItem(ADMIN_SESSION_STORAGE_KEY), null)
})
