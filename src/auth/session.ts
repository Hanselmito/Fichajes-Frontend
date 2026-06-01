const SESSION_STORAGE_KEY = 'fichaje.frontend.session'
const LEGACY_TOKEN_STORAGE_KEY = 'fichaje.frontend.token'

export type StoredSession = {
  accessToken: string
  refreshToken: string | null
}

function parseStoredSession(rawSession: string | null): StoredSession | null {
  if (!rawSession) {
    return null
  }

  try {
    const parsed = JSON.parse(rawSession) as Partial<StoredSession>

    if (typeof parsed.accessToken !== 'string' || parsed.accessToken.trim() === '') {
      return null
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken:
        typeof parsed.refreshToken === 'string' && parsed.refreshToken.trim() !== ''
          ? parsed.refreshToken
          : null,
    }
  } catch {
    return null
  }
}

export function getStoredSession(): StoredSession | null {
  const storedSession = parseStoredSession(window.localStorage.getItem(SESSION_STORAGE_KEY))

  if (storedSession) {
    return storedSession
  }

  const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY)

  if (typeof legacyToken === 'string' && legacyToken.trim() !== '') {
    return {
      accessToken: legacyToken,
      refreshToken: null,
    }
  }

  return null
}

export function getStoredAccessToken(): string | null {
  return getStoredSession()?.accessToken ?? null
}

export function getStoredRefreshToken(): string | null {
  return getStoredSession()?.refreshToken ?? null
}

export function storeSession(session: StoredSession): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)
}

export function getStoredToken(): string | null {
  return getStoredAccessToken()
}

export function storeToken(token: string): void {
  storeSession({ accessToken: token, refreshToken: null })
}

export function clearStoredToken(): void {
  clearStoredSession()
}
