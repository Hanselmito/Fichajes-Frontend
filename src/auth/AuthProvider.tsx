import {
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { apiClient, getErrorMessage } from '../api/client'
import { clearStoredToken, storeToken } from './session'
import type { paths } from '../api/generated'
import { AuthContext, type Capabilities, type UserDetails } from './context'

type LoginResponse =
  paths['/auth/login']['post']['responses']['200']['content']['application/json']

async function requestSession(): Promise<{
  user: UserDetails
  capabilities: Capabilities
}> {
  const [meResult, capabilitiesResult] = await Promise.all([
    apiClient.GET('/auth/me'),
    apiClient.GET('/auth/capabilities'),
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
    storeToken(loginData.token)
    await refreshSession()
  }

  const logout = async () => {
    try {
      await apiClient.POST('/auth/logout')
    } finally {
      clearStoredToken()
      setUser(null)
      setCapabilities(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        await refreshSession()
      } catch {
        clearStoredToken()
        if (!cancelled) {
          setUser(null)
          setCapabilities(null)
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
