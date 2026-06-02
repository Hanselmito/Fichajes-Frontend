import type { components, paths } from '../api/generated'

export type RecordsResponse =
  paths['/records']['get']['responses']['200']['content']['application/json']
export type RecordItem = RecordsResponse['records'][number]

export type UsersResponse =
  paths['/users']['get']['responses']['200']['content']['application/json']
export type UserItem = UsersResponse['users'][number]

export type ClientItem = components['schemas']['ClientSummary']

export type QuadrantItem = components['schemas']['QuadrantItem']
export type QuadrantDetail = components['schemas']['QuadrantResourceResponse']['quadrant']
export type QuadrantAssignment = components['schemas']['QuadrantAssignmentItem']