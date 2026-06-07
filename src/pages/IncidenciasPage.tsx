import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

interface IncidenciaItem {
  id: number;
  tipo: string;
  estado: string;
  prioridad: string;
  descripcion: string;
  created_at: string;
  employee_id?: number;
}

export function IncidenciasPage() {
  const incidenciasQuery = useQuery({
    queryKey: ['incidencias'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/incidencias'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar incidencias'))
      const data = result.data as unknown as { incidencias?: IncidenciaItem[] } | IncidenciaItem[]
      return (Array.isArray(data) ? data : data.incidencias) ?? []
    },
  })

  const incidencias = incidenciasQuery.data ?? []

  return (
    <>
      <PageHeader
        eyebrow="Operativa"
        subtitle="Registro de problemas reportados (material, salud, clientes, etc.)."
        title="Incidencias"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Total Incidencias</span>
          <p className="metric-value">{incidencias.length}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Listado de Incidencias</strong>
            <p className="table-note">Reportes registrados en el sistema.</p>
          </div>
        </div>

        {incidenciasQuery.isLoading ? <p className="empty-text">Cargando incidencias...</p> : null}
        {incidenciasQuery.isError ? (
          <div className="error-banner">{incidenciasQuery.error.message}</div>
        ) : null}

        {incidencias.length > 0 ? (
          <div className="legacy-list-grid">
            {incidencias.map((inc: IncidenciaItem) => (
              <article className="legacy-list-card" key={inc.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{inc.tipo || 'General'}</strong>
                    <span>{inc.estado || 'Pendiente'}</span>
                  </div>
                  <span className={`status-pill ${inc.prioridad === 'alta' ? 'tone-danger' : ''}`}>
                    {inc.prioridad || 'normal'}
                  </span>
                </div>
                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Descripción</span>
                    <p className="meta-value">{inc.descripcion || '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Fecha</span>
                    <p className="meta-value">{inc.created_at ? new Date(inc.created_at).toLocaleDateString() : '---'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !incidenciasQuery.isLoading && <p className="empty-text">No hay incidencias registradas.</p>
        )}
      </section>
    </>
  )
}
