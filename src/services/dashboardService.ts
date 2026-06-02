import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import type { DashboardResponse } from '../types/dashboard'

export async function loadDashboard(): Promise<DashboardResponse> {
  const result = await withAccessRefresh(() => apiClient.GET('/dashboard'))

  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo cargar el dashboard'))
  }

  return result.data
}