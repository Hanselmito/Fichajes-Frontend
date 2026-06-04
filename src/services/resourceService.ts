import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import type {
  ClientItem,
  QuadrantDetail,
  QuadrantItem,
  RecordItem,
  UserItem,
} from '../types/resources'

export async function loadRecords(): Promise<RecordItem[]> {
  const result = await withAccessRefresh(() => apiClient.GET('/records'))

  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los fichajes'))
  }

  return result.data.records
}

export async function loadUsers(): Promise<UserItem[]> {
  const result = await withAccessRefresh(() => apiClient.GET('/users'))

  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los usuarios'))
  }

  return result.data.users
}

export async function createUser(user: import('../api/generated').components['schemas']['UserCreateRequest']): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.POST('/users', { body: user }))
  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo crear el usuario'))
  }
}

export async function updateUser(userId: number, user: import('../api/generated').components['schemas']['UserUpdateRequest']): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.PUT('/users/{userId}', {
    params: { path: { userId } },
    body: user,
  }))
  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo actualizar el usuario'))
  }
}

export async function deleteUser(userId: number): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.DELETE('/users/{userId}', {
    params: { path: { userId } },
  }))
  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo eliminar el usuario'))
  }
}

export async function loadClients(): Promise<ClientItem[]> {
  const result = await withAccessRefresh(() => apiClient.GET('/clients'))

  if (result.error || !result.data || !('clients' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los clientes'))
  }

  return result.data.clients
}

export async function loadZones(): Promise<import('../types/resources').ZoneItem[]> {
  const result = await withAccessRefresh(() => apiClient.GET('/zones'))

  if (result.error || !result.data || !('zones' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar las zonas'))
  }

  return result.data.zones
}

export async function createZone(zone: import('../api/generated').components['schemas']['ZoneCreateRequest']): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.POST('/zones', { body: zone }))
  
  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo crear la zona'))
  }
}

export async function updateZone(zoneId: number, zone: import('../api/generated').components['schemas']['ZoneUpdateRequest']): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.PUT('/zones/{zoneId}', {
    params: { path: { zoneId } },
    body: zone,
  }))

  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo actualizar la zona'))
  }
}

export async function deleteZone(zoneId: number): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.DELETE('/zones/{zoneId}', {
    params: { path: { zoneId } },
  }))

  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo eliminar la zona'))
  }
}

export async function regenerateZoneQr(zoneId: number): Promise<{ qr_code: string }> {
  const result = await withAccessRefresh(() => apiClient.POST('/zones/{zoneId}/regenerate-qr', {
    params: { path: { zoneId } },
  }))

  if (result.error || !result.data?.success || !('qr_code' in result.data)) {
    throw new Error(getErrorMessage(result.error, 'No se pudo regenerar el QR de la zona'))
  }

  return { qr_code: result.data.qr_code as string }
}

export async function loadQuadrants(): Promise<QuadrantItem[]> {
  const result = await withAccessRefresh(() => apiClient.GET('/quadrants'))

  if (result.error || !result.data || !('quadrants' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los cuadrantes'))
  }

  return result.data.quadrants
}

export async function loadReportsStats(): Promise<import('../api/generated').components['schemas']['ReportStatsPayload']> {
  const result = await withAccessRefresh(() => apiClient.GET('/reports', {
    params: { query: { format: 'stats' } },
  }))

  if (result.error || !result.data || typeof result.data !== 'object' || !('stats' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los reportes'))
  }

  return result.data.stats
}

export async function loadWorkHoursBalance(employeeId: number, month: string): Promise<import('../api/generated').components['schemas']['WorkHoursBalanceResponse']> {
  const result = await withAccessRefresh(() => apiClient.GET('/work-hours', {
    params: { query: { balance: true, employeeId, month } },
  }))

  if (result.error || !result.data || !('balance' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo cargar el balance de horas'))
  }

  return result.data as import('../api/generated').components['schemas']['WorkHoursBalanceResponse']
}

export async function loadVacationRequests(): Promise<import('../api/generated').components['schemas']['VacationRequestItem'][]> {
  const result = await withAccessRefresh(() => apiClient.GET('/vacation-requests'))
  if (result.error || !result.data || !('requests' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar las solicitudes'))
  }
  return result.data.requests
}

export async function approveVacationRequest(requestId: number, reason: string = ''): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.PUT('/vacation-requests/{requestId}/approve', {
    params: { path: { requestId } },
    body: { reason }
  }))
  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo aprobar la solicitud'))
  }
}

export async function rejectVacationRequest(requestId: number, reason: string = ''): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.PUT('/vacation-requests/{requestId}/reject', {
    params: { path: { requestId } },
    body: { reason }
  }))
  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo rechazar la solicitud'))
  }
}

export async function loadVacations(): Promise<import('../api/generated').components['schemas']['VacationItem'][]> {
  const result = await withAccessRefresh(() => apiClient.GET('/vacations'))
  if (result.error || !result.data || !('vacations' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar las vacaciones confirmadas'))
  }
  return result.data.vacations
}

export async function deleteVacation(vacationId: number): Promise<void> {
  const result = await withAccessRefresh(() => apiClient.DELETE('/vacations/{vacationId}', {
    params: { path: { vacationId } }
  }))
  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo eliminar la vacación'))
  }
}

export async function loadQuadrantDetail(quadrantId: number | string): Promise<QuadrantDetail> {
  const result = await withAccessRefresh(() =>
    apiClient.GET('/quadrants/{quadrantId}', {
      params: {
        path: {
          quadrantId: Number(quadrantId),
        },
      },
    }),
  )

  if (result.error || !result.data || !('quadrant' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo cargar el detalle del cuadrante'))
  }

  return result.data.quadrant
}