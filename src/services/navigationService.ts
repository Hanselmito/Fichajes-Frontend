import type { Capabilities } from '../types/auth'

export const sectionRouteMap: Record<string, string> = {
  dashboard: '/',
  records: '/records',
  users: '/users',
  clients: '/clients',
  quadrants: '/quadrants',
  contract: '/contract',
  readiness: '/readiness',
}

export function getSectionPath(sectionId: string): string {
  return sectionRouteMap[sectionId] ?? `/workspace/${sectionId}`
}

export function getVisibleSections(capabilities: Capabilities | null): string[] {
  return Object.entries(capabilities?.navigation ?? {})
    .filter(([, visible]) => visible)
    .map(([key]) => key)
}