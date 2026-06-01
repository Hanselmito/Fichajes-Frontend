import {
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  apiClient,
  getErrorMessage,
  setAuthFailureHandler,
  withAccessRefresh,
} from '../api/client'
import {
  clearStoredSession,
  getStoredRefreshToken,
  getStoredSession,
  storeSession,
} from './session'
import type { paths } from '../api/generated'
import { AuthContext, type Capabilities, type UserDetails } from './context'

type LoginResponse =
  paths['/auth/login']['post']['responses']['200']['content']['application/json']

async function requestSession(): Promise<{
  user: UserDetails
  capabilities: Capabilities
}> {
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

export function AuthProvider({ children }: PropsWithChildren) {
  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState<UserDetails | null>(null)
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null)

  const clearAuthState = () => {
    clearStoredSession()
    setUser(null)
    setCapabilities(null)
  }

  const refreshSession = async () => {
    const session = await requestSession()
    setUser(session.user)
    setCapabilities(session.capabilities)
  }

  const login = async (username: string, password: string) => {
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
    await refreshSession()
  }

  const logout = async () => {
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
      clearAuthState()
    }
  }

  useEffect(() => {
    let cancelled = false

    setAuthFailureHandler(() => {
      if (!cancelled) {
        clearAuthState()
      }
    })

    async function restoreSession() {
      if (!getStoredSession()) {
        if (!cancelled) {
          setInitializing(false)
        }

        return
      }

      try {
        await refreshSession()
      } catch {
        if (!cancelled) {
          clearAuthState()
        }
      } finally {
        if (!cancelled) {
          setInitializing(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
      setAuthFailureHandler(null)
    }
  }, [])

  const value = {
    initializing,
    isAuthenticated: user !== null,
    user,
    capabilities,
    login,
    logout,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
