import type { Capabilities } from '../types/auth'

export const sectionRouteMap: Record<string, string> = {
  dashboard: '/',
  records: '/records',
  users: '/users',
  clients: '/clients',
  zones: '/zones',
  reports: '/reports',
  vacations: '/vacations',
  vacation_requests: '/vacations',
  quadrants: '/quadrants',
  schedules: '/schedules',
  employee_schedules: '/schedules',
  tolerance: '/schedules',
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