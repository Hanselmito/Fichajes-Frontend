import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

interface BreakItem {
  id: number;
  employee_id: number;
  employee?: {
    name: string;
  };
  start_time: string;
  end_time: string | null;
  status: string;
}

export function BreaksPage() {
  const breaksQuery = useQuery({
    queryKey: ['breaks'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/breaks'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar descansos'))
      const data = result.data as unknown as { breaks?: BreakItem[] } | BreakItem[]
      return (Array.isArray(data) ? data : data.breaks) ?? []
    },
  })

  const breaks = breaksQuery.data ?? []

  return (
    <>
      <PageHeader
        eyebrow="Control de Presencia"
        subtitle="Visualiza el historial y estado de los descansos de los empleados durante su jornada."
        title="Descansos"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Descansos Registrados</span>
          <p className="metric-value">{breaks.length}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Listado de Descansos</strong>
            <p className="table-note">Registro histórico de pausas por empleado.</p>
          </div>
        </div>

        {breaksQuery.isLoading ? <p className="empty-text">Cargando descansos...</p> : null}
        {breaksQuery.isError ? (
          <div className="error-banner">{breaksQuery.error.message}</div>
        ) : null}

        {breaks.length > 0 ? (
          <div className="legacy-list-grid">
            {breaks.map((b: BreakItem) => (
              <article className="legacy-list-card" key={b.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{b.employee?.name || b.employee_id || 'Empleado Desconocido'}</strong>
                    <span>{b.status === 'en_curso' ? 'En curso' : 'Completado'}</span>
                  </div>
                </div>
                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Inicio</span>
                    <p className="meta-value">{b.start_time ? new Date(b.start_time).toLocaleString() : '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Fin</span>
                    <p className="meta-value">{b.end_time ? new Date(b.end_time).toLocaleString() : '---'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !breaksQuery.isLoading && <p className="empty-text">No hay descansos registrados.</p>
        )}
      </section>
    </>
  )
}
