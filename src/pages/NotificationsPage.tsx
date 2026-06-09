import { useQuery } from '@tanstack/react-query'
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
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/notifications'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar notificaciones'))
      const data = result.data as unknown as { notifications?: NotificationItem[] } | NotificationItem[]
      return (Array.isArray(data) ? data : data.notifications) ?? []
    },
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
                  {!notif.is_read && <span className="status-pill tone-warning">Nueva</span>}
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
