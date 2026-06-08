import { useQuery } from '@tanstack/react-query'
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
    <div className="card">
      <h2>📅 Calendarios y Festivos</h2>
      <p>Definición de calendarios laborales y días festivos.</p>
      
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <strong>Calendarios Activos: </strong> {calendars.length}
      </div>

      <div className="section-head-row" style={{ marginTop: '2rem' }}>
        <div>
          <strong>Listado de Calendarios</strong>
          <p className="table-note">Calendarios base asignables a empleados o zonas.</p>
        </div>
      </div>

      {calendarsQuery.isLoading ? <p className="empty-text">Cargando calendarios...</p> : null}
      {calendarsQuery.isError ? (
        <div className="alert alert-error">{calendarsQuery.error.message}</div>
      ) : null}

      {calendars.length > 0 ? (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Año</th>
                <th>Comunidad Autónoma</th>
              </tr>
            </thead>
            <tbody>
              {calendars.map((cal: CalendarItem) => (
                <tr key={cal.id}>
                  <td>{cal.id}</td>
                  <td>{cal.name || `Calendario #${cal.id}`}</td>
                  <td>{cal.year || '---'}</td>
                  <td>{cal.comunidad_autonoma || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !calendarsQuery.isLoading && <p className="empty-text">No hay calendarios definidos.</p>
      )}
    </div>
  )
}
