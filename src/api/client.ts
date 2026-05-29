import createClient from 'openapi-fetch'
import { getStoredToken } from '../auth/session'
import { getApiBaseUrl } from './config'
import type { paths } from './generated'

export const apiClient = createClient<paths>({
  baseUrl: getApiBaseUrl(),
})

apiClient.use({
  onRequest({ request }) {
    const token = getStoredToken()

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }

    request.headers.set('Accept', 'application/json')

    return request
  },
})

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim() !== '') {
      return message
    }
  }

  return fallback
}
