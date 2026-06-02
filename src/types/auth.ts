import type { paths } from '../api/generated'

export type LoginResponse =
  paths['/auth/login']['post']['responses']['200']['content']['application/json']

export type MeResponse =
  paths['/auth/me']['get']['responses']['200']['content']['application/json']

export type CapabilitiesResponse =
  paths['/auth/capabilities']['get']['responses']['200']['content']['application/json']

export type UserDetails = MeResponse['user']

export type Capabilities = CapabilitiesResponse['capabilities']

export type AuthSessionState = {
  user: UserDetails
  capabilities: Capabilities
}

export type AuthContextValue = {
  initializing: boolean
  isAuthenticated: boolean
  user: UserDetails | null
  capabilities: Capabilities | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}