import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { clearStoredSession, getStoredRefreshToken, storeSession } from '../auth/session'
import type { AuthSessionState, LoginResponse } from '../types/auth'

export async function requestSession(): Promise<AuthSessionState> {
  const [meResult, capabilitiesResult] = await Promise.all([
    withAccessRefresh(() => apiClient.GET('/auth/me')),
    withAccessRefresh(() => apiClient.GET('/auth/capabilities')),
  ])

  if (meResult.error || !meResult.data?.success) {
    throw new Error(getErrorMessage(meResult.error, 'No se pudo recuperar la sesion'))
  }

  if (capabilitiesResult.error || !capabilitiesResult.data?.success) {
    throw new Error(
      getErrorMessage(capabilitiesResult.error, 'No se pudieron recuperar las capacidades'),
    )
  }

  return {
    user: meResult.data.user,
    capabilities: capabilitiesResult.data.capabilities,
  }
}

export async function loginWithCredentials(username: string, password: string): Promise<void> {
  const result = await apiClient.POST('/auth/login', {
    body: { username, password },
  })

  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'Login no valido'))
  }

  const loginData = result.data as LoginResponse

  storeSession({
    accessToken: loginData.access_token,
    refreshToken: loginData.refresh_token,
  })
}

export async function logoutCurrentSession(): Promise<void> {
  const refreshToken = getStoredRefreshToken()

  try {
    if (refreshToken) {
      await apiClient.POST('/auth/logout', {
        body: { refreshToken },
      })
    } else {
      await apiClient.POST('/auth/logout')
    }
  } finally {
    clearStoredSession()
  }
}