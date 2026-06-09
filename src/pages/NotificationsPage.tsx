import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

interface NotificationItem {
  id: string | number
  created_at: string
  is_read: boolean
  title?: string | null
  message?: string | null
  type?: string | null
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const notificationsQuery = useQuery({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/notifications', {
        params: { query: { unreadOnly: showUnreadOnly, limit: 100 } },
      }))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar notificaciones'))
      const data = result.data as unknown as { notifications?: NotificationItem[] } | NotificationItem[]
      return (Array.isArray(data) ? data : data.notifications) ?? []
    },
  })

  const readMutation = useMutation({
    mutationFn: async (notificationId: string | number) => {
      const result = await withAccessRefresh(() => apiClient.PUT('/notifications/{notificationId}/read', {
        params: { path: { notificationId: Number(notificationId) } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo marcar la notificación como leída'))
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const readAllMutation = useMutation({
    mutationFn: async () => {
      const result = await withAccessRefresh(() => apiClient.PUT('/notifications/read-all'))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudieron marcar como leídas'))
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string | number) => {
      const result = await withAccessRefresh(() => apiClient.DELETE('/notifications/{notificationId}', {
        params: { path: { notificationId: Number(notificationId) } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo eliminar la notificación'))
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = notificationsQuery.data ?? []

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        subtitle="Bandeja de entrada para las alertas y avisos del sistema."
        title="Notificaciones"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Alertas Sin Leer</span>
          <p className="metric-value tone-warning">
            {notifications.filter((n: NotificationItem) => !n.is_read).length}
          </p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Historial de Notificaciones</strong>
            <p className="table-note">Mensajes automáticos recibidos por tu cuenta.</p>
          </div>
          <div className="inline-actions">
            <button className="secondary-button" onClick={() => setShowUnreadOnly((current) => !current)} type="button">
              {showUnreadOnly ? 'Ver todas' : 'Solo sin leer'}
            </button>
            <button className="primary-button" disabled={readAllMutation.isPending} onClick={() => readAllMutation.mutate()} type="button">
              Marcar todas leídas
            </button>
          </div>
        </div>

        {notificationsQuery.isLoading ? <p className="empty-text">Cargando notificaciones...</p> : null}
        {notificationsQuery.isError ? (
          <div className="error-banner">{notificationsQuery.error.message}</div>
        ) : null}

        {notifications.length > 0 ? (
          <div className="legacy-list-grid">
            {notifications.map((notif: NotificationItem) => (
              <article className="legacy-list-card" key={notif.id} style={{ opacity: notif.is_read ? 0.6 : 1 }}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{notif.title || notif.type || 'Notificación'}</strong>
                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!notif.is_read ? <span className="status-pill tone-warning">Nueva</span> : <span className="status-pill">Leída</span>}
                    {!notif.is_read ? <button className="secondary-button" onClick={() => readMutation.mutate(notif.id)} type="button">Marcar leída</button> : null}
                    <button className="secondary-button" onClick={() => deleteMutation.mutate(notif.id)} type="button" style={{ color: '#b42318', borderColor: '#fecaca' }}>Eliminar</button>
                  </div>
                </div>
                <div className="legacy-detail-grid">
                  <div style={{ gridColumn: 'span 2' }}>
                    <p className="meta-value">{notif.message || 'Sin mensaje adicional.'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !notificationsQuery.isLoading && <p className="empty-text">No tienes notificaciones.</p>
        )}
      </section>
    </>
  )
}
