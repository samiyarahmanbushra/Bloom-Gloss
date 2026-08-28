export const ADMIN_SESSION_STORAGE_KEY = 'bloom-and-gloss-admin-session'

export function createAdminSession(sessionDurationMs = 1000 * 60 * 60) {
  const now = Date.now()

  return {
    createdAt: now,
    expiresAt: now + sessionDurationMs,
    sessionDurationMs,
  }
}

export function persistAdminSession(session, storage = window.localStorage) {
  if (!storage) {
    return null
  }

  const serialized = JSON.stringify(session)
  storage.setItem(ADMIN_SESSION_STORAGE_KEY, serialized)
  return session
}

export function readAdminSession(storage = window.localStorage, now = Date.now()) {
  if (!storage) {
    return null
  }

  const rawSession = storage.getItem(ADMIN_SESSION_STORAGE_KEY)
  if (!rawSession) {
    return null
  }

  try {
    const parsed = JSON.parse(rawSession)
    if (!parsed || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= now) {
      storage.removeItem(ADMIN_SESSION_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    storage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    return null
  }
}

export function clearAdminSession(storage = window.localStorage) {
  if (!storage) {
    return
  }

  storage.removeItem(ADMIN_SESSION_STORAGE_KEY)
}
