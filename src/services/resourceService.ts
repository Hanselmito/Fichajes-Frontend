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

export async function loadClients(): Promise<ClientItem[]> {
  const result = await withAccessRefresh(() => apiClient.GET('/clients'))

  if (result.error || !result.data || !('clients' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los clientes'))
  }

  return result.data.clients
}

export async function loadQuadrants(): Promise<QuadrantItem[]> {
  const result = await withAccessRefresh(() => apiClient.GET('/quadrants'))

  if (result.error || !result.data || !('quadrants' in result.data) || !result.data.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los cuadrantes'))
  }

  return result.data.quadrants
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