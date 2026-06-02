import type { paths } from '../api/generated'

export type DashboardResponse =
  paths['/dashboard']['get']['responses']['200']['content']['application/json']

export type DashboardEmployee = DashboardResponse['employees'][number]

export type DashboardHistoryEntry = NonNullable<
  NonNullable<DashboardResponse['checkins_summary']>['history']
>[number]