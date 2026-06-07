import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

interface ModificationRequest {
  id: number;
  employee_id: number;
  employee?: {
    name: string;
  };
  status: string;
  reason: string;
  original_record_id: number | null;
}

export function ModificationsPage() {
  const modificationsQuery = useQuery({
    queryKey: ['modifications'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/modifications/requests'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar modificaciones'))
      const data = result.data as unknown as { requests?: ModificationRequest[] } | ModificationRequest[]
      return (Array.isArray(data) ? data : data.requests) ?? []
    },
  })

  const requests = modificationsQuery.data ?? []

  return (
    <>
      <PageHeader
        eyebrow="Control Horario"
        subtitle="Aprobación o rechazo de peticiones de corrección de fichajes erróneos o faltantes."
        title="Peticiones de Modificación"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Peticiones Totales</span>
          <p className="metric-value">{requests.length}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Listado de Peticiones</strong>
            <p className="table-note">Peticiones de los empleados para corregir sus marcajes.</p>
          </div>
        </div>

        {modificationsQuery.isLoading ? <p className="empty-text">Cargando peticiones...</p> : null}
        {modificationsQuery.isError ? (
          <div className="error-banner">{modificationsQuery.error.message}</div>
        ) : null}

        {requests.length > 0 ? (
          <div className="legacy-list-grid">
            {requests.map((req: ModificationRequest) => (
              <article className="legacy-list-card" key={req.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{req.employee?.name || `Empleado ID: ${req.employee_id}`}</strong>
                    <span>{req.status || 'pendiente'}</span>
                  </div>
                </div>
                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Motivo</span>
                    <p className="meta-value">{req.reason || '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Fecha original</span>
                    <p className="meta-value">{req.original_record_id ? `Fichaje #${req.original_record_id}` : 'Fichaje olvidado'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !modificationsQuery.isLoading && <p className="empty-text">No hay peticiones de modificación.</p>
        )}
      </section>
    </>
  )
}
