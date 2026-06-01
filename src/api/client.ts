import createClient from 'openapi-fetch'
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeSession,
} from '../auth/session'
import { getApiBaseUrl } from './config'
import type { paths } from './generated'

type RefreshResponse =
  paths['/auth/refresh']['post']['responses']['200']['content']['application/json']

let authFailureHandler: (() => void) | null = null
let refreshPromise: Promise<boolean> | null = null

export const apiClient = createClient<paths>({
  baseUrl: getApiBaseUrl(),
})

apiClient.use({
  onRequest({ request }) {
    const token = getStoredAccessToken()

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }

    request.headers.set('Accept', 'application/json')

    return request
  },
})

function resolveApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '')

  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return `${baseUrl}${path}`
  }

  return `${window.location.origin}${baseUrl}${path}`
}

function handleAuthenticationLost(): void {
  authFailureHandler?.()
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken()

    if (!refreshToken) {
      return false
    }

    try {
      const response = await fetch(resolveApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        return false
      }

      const data = (await response.json()) as RefreshResponse

      if (!data.success) {
        return false
      }

      storeSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      })

      return true
    } catch {
      return false
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export function setAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler
}

export async function withAccessRefresh<T extends { response: Response }>(
  operation: () => Promise<T>,
): Promise<T> {
  const result = await operation()

  if (result.response.status !== 401) {
    return result
  }

  const refreshed = await refreshAccessToken()

  if (!refreshed) {
    clearStoredSession()
    handleAuthenticationLost()

    return result
  }

  const retriedResult = await operation()

  if (retriedResult.response.status === 401) {
    clearStoredSession()
    handleAuthenticationLost()
  }

  return retriedResult
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim() !== '') {
      return message
    }
  }

  return fallback
}
