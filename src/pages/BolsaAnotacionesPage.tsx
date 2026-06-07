import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

interface BolsaAnotacion {
  id: number;
  employee_id: number;
  employee?: {
    name: string;
  };
  minutos: number;
  motivo: string;
  fecha: string;
}

export function BolsaAnotacionesPage() {
  const bolsaQuery = useQuery({
    queryKey: ['bolsa_anotaciones'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/bolsa-anotaciones'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar anotaciones'))
      const data = result.data as unknown as { anotaciones?: BolsaAnotacion[] } | BolsaAnotacion[]
      return (Array.isArray(data) ? data : data.anotaciones) ?? []
    },
  })

  const anotaciones = bolsaQuery.data ?? []

  return (
    <>
      <PageHeader
        eyebrow="Control Horario"
        subtitle="Gestión de horas extras y compensaciones para los empleados."
        title="Bolsa de Horas"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Anotaciones Totales</span>
          <p className="metric-value">{anotaciones.length}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Listado de Anotaciones</strong>
            <p className="table-note">Horas añadidas o restadas a la bolsa del empleado.</p>
          </div>
        </div>

        {bolsaQuery.isLoading ? <p className="empty-text">Cargando anotaciones...</p> : null}
        {bolsaQuery.isError ? (
          <div className="error-banner">{bolsaQuery.error.message}</div>
        ) : null}

        {anotaciones.length > 0 ? (
          <div className="legacy-list-grid">
            {anotaciones.map((anotacion: BolsaAnotacion) => (
              <article className="legacy-list-card" key={anotacion.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{anotacion.employee?.name || `Empleado ID: ${anotacion.employee_id}`}</strong>
                    <span className={anotacion.minutos >= 0 ? 'tone-success' : 'tone-danger'}>
                      {anotacion.minutos >= 0 ? '+' : ''}{anotacion.minutos} min
                    </span>
                  </div>
                </div>
                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Motivo</span>
                    <p className="meta-value">{anotacion.motivo || '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Fecha</span>
                    <p className="meta-value">{anotacion.fecha ? new Date(anotacion.fecha).toLocaleDateString() : '---'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !bolsaQuery.isLoading && <p className="empty-text">No hay anotaciones en la bolsa.</p>
        )}
      </section>
    </>
  )
}
