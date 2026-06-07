import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

interface CalendarItem {
  id: number;
  name: string;
  year?: number;
  comunidad_autonoma?: string;
}

export function CalendarsPage() {
  const calendarsQuery = useQuery({
    queryKey: ['calendars'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/calendars'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar calendarios'))
      const data = result.data as unknown as { calendarios?: CalendarItem[] } | CalendarItem[]
      return (Array.isArray(data) ? data : data.calendarios) ?? []
    },
  })

  const calendars = calendarsQuery.data ?? []

  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        subtitle="Definición de calendarios laborales y días festivos."
        title="Calendarios y Festivos"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Calendarios Activos</span>
          <p className="metric-value">{calendars.length}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Listado de Calendarios</strong>
            <p className="table-note">Calendarios base asignables a empleados o zonas.</p>
          </div>
        </div>

        {calendarsQuery.isLoading ? <p className="empty-text">Cargando calendarios...</p> : null}
        {calendarsQuery.isError ? (
          <div className="error-banner">{calendarsQuery.error.message}</div>
        ) : null}

        {calendars.length > 0 ? (
          <div className="legacy-list-grid">
            {calendars.map((cal: CalendarItem) => (
              <article className="legacy-list-card" key={cal.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{cal.name || `Calendario #${cal.id}`}</strong>
                    <span>{cal.year || '---'}</span>
                  </div>
                </div>
                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Comunidad Autónoma</span>
                    <p className="meta-value">{cal.comunidad_autonoma || '---'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !calendarsQuery.isLoading && <p className="empty-text">No hay calendarios definidos.</p>
        )}
      </section>
    </>
  )
}
