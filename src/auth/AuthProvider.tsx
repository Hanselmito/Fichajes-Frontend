import {
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { setAuthFailureHandler } from '../api/client'
import { clearStoredSession, getStoredSession } from './session'
import { AuthContext } from './context'
import { loginWithCredentials, logoutCurrentSession, requestSession } from '../services/authService'
import type { Capabilities, UserDetails } from '../types/auth'

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
    await loginWithCredentials(username, password)
    await refreshSession()
  }

  const logout = async () => {
    try {
      await logoutCurrentSession()
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
