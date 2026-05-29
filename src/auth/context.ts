import { createContext } from 'react'
import type { paths } from '../api/generated'

type MeResponse =
  paths['/auth/me']['get']['responses']['200']['content']['application/json']
type CapabilitiesResponse =
  paths['/auth/capabilities']['get']['responses']['200']['content']['application/json']

export type UserDetails = MeResponse['user']
export type Capabilities = CapabilitiesResponse['capabilities']

export type AuthContextValue = {
  initializing: boolean
  isAuthenticated: boolean
  user: UserDetails | null
  capabilities: Capabilities | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
