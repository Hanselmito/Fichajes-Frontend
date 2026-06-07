import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

interface NotificationItem {
  id: string | number;
  created_at: string;
  read_at: string | null;
  data: {
    title?: string;
    message?: string;
  };
}

export function NotificationsPage() {
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/notifications'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar notificaciones'))
      const data = result.data as unknown as { notificaciones?: NotificationItem[] } | NotificationItem[]
      return (Array.isArray(data) ? data : data.notificaciones) ?? []
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
            {notifications.filter((n: NotificationItem) => !n.read_at).length}
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
              <article className="legacy-list-card" key={notif.id} style={{ opacity: notif.read_at ? 0.6 : 1 }}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{notif.data?.title || 'Notificación'}</strong>
                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                  {!notif.read_at && <span className="status-pill tone-warning">Nueva</span>}
                </div>
                <div className="legacy-detail-grid">
                  <div style={{ gridColumn: 'span 2' }}>
                    <p className="meta-value">{notif.data?.message || '---'}</p>
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
