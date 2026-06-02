import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { loadQuadrantDetail, loadQuadrants } from '../services/resourceService'
import type { QuadrantAssignment } from '../types/resources'

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Sin fecha'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function QuadrantsPage() {
  const [selectedQuadrantId, setSelectedQuadrantId] = useState<number | null>(null)

  const quadrantsQuery = useQuery({
    queryKey: ['quadrants'],
    queryFn: loadQuadrants,
  })

  const quadrants = quadrantsQuery.data ?? []
  const effectiveSelectedQuadrantId =
    selectedQuadrantId ?? (quadrants[0]?.id !== undefined ? Number(quadrants[0].id) : null)

  const detailQuery = useQuery({
    queryKey: ['quadrants', effectiveSelectedQuadrantId],
    queryFn: () => loadQuadrantDetail(effectiveSelectedQuadrantId ?? 0),
    enabled: effectiveSelectedQuadrantId !== null,
  })

  const templates = quadrants.filter((quadrant) => Boolean(quadrant.is_template)).length
  const totalAssignments = quadrants.reduce(
    (sum, quadrant) => sum + Number(quadrant.total_assignments ?? 0),
    0,
  )
  const assignments = detailQuery.data?.assignments ?? []

  return (
    <>
      <PageHeader
        eyebrow="Cuadrantes"
        subtitle="Vista de cuadrantes reales del backend, con selector de semana y detalle de asignaciones activo como en el panel operativo legacy."
        title="Planificacion semanal"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Cuadrantes</span>
          <p className="metric-value">{quadrants.length}</p>
        </article>
        <article className="metric-card">
          <span>Plantillas</span>
          <p className="metric-value">{templates}</p>
        </article>
        <article className="metric-card">
          <span>Asignaciones</span>
          <p className="metric-value tone-success">{totalAssignments}</p>
        </article>
        <article className="metric-card">
          <span>Seleccionado</span>
          <p className="metric-value tone-warning">{effectiveSelectedQuadrantId ?? '—'}</p>
        </article>
      </section>

      <section className="quadrant-layout-grid">
        <article className="table-card resource-shell-card">
          <div className="section-head-row">
            <div>
              <strong>Semanas disponibles</strong>
              <p className="table-note">
                Selecciona un cuadrante para ver detalle de asignaciones, zona y creador.
              </p>
            </div>
            <span className="status-pill">Legacy /quadrants</span>
          </div>

          {quadrantsQuery.isLoading ? <p className="empty-text">Cargando cuadrantes...</p> : null}
          {quadrantsQuery.isError ? <div className="error-banner">{quadrantsQuery.error.message}</div> : null}

          <div className="legacy-list-grid quadrant-list-grid">
            {quadrants.map((quadrant) => (
              <button
                className={`legacy-list-card legacy-list-button ${effectiveSelectedQuadrantId === Number(quadrant.id) ? 'is-active' : ''}`}
                key={quadrant.id}
                onClick={() => setSelectedQuadrantId(Number(quadrant.id))}
                type="button"
              >
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{quadrant.name}</strong>
                    <span>{quadrant.zone_name ?? 'Sin zona'}</span>
                  </div>
                  <span className="status-pill">
                    {quadrant.is_template ? 'plantilla' : 'semana'}
                  </span>
                </div>

                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Semana</span>
                    <p className="meta-value">{formatDate(quadrant.week_start)}</p>
                  </div>
                  <div>
                    <span className="meta-label">Creador</span>
                    <p className="meta-value">{quadrant.created_by_name ?? 'Sin creador'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Asignaciones</span>
                    <p className="meta-value">{quadrant.total_assignments ?? 0}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="table-card resource-shell-card">
          <div className="section-head-row">
            <div>
              <strong>Detalle del cuadrante</strong>
              <p className="table-note">
                Asignaciones activas del cuadrante seleccionado con empleado, cliente y cobertura de servicios.
              </p>
            </div>
            {detailQuery.data ? <span className="status-pill">#{detailQuery.data.id}</span> : null}
          </div>

          {detailQuery.isLoading ? <p className="empty-text">Cargando detalle...</p> : null}
          {detailQuery.isError ? <div className="error-banner">{detailQuery.error.message}</div> : null}

          {detailQuery.data ? (
            <div className="legacy-list-grid">
              {assignments.length > 0 ? (
                assignments.map((assignment: QuadrantAssignment) => (
                  <article className="legacy-list-card" key={assignment.id}>
                    <div className="legacy-list-card-head">
                      <div>
                        <strong>{assignment.employee_name ?? 'Empleado sin asignar'}</strong>
                        <span>{assignment.client_name ?? 'Cliente sin nombre'}</span>
                      </div>
                      <span className={`status-pill ${assignment.service_coverage_complete ? 'success' : 'warning'}`}>
                        {assignment.start_time} - {assignment.end_time}
                      </span>
                    </div>

                    <div className="legacy-detail-grid">
                      <div>
                        <span className="meta-label">Dia</span>
                        <p className="meta-value">{assignment.day_of_week}</p>
                      </div>
                      <div>
                        <span className="meta-label">Direccion</span>
                        <p className="meta-value">{assignment.client_address ?? 'Sin direccion'}</p>
                      </div>
                      <div>
                        <span className="meta-label">Ciudad</span>
                        <p className="meta-value">{assignment.client_city ?? 'Sin ciudad'}</p>
                      </div>
                      <div>
                        <span className="meta-label">Servicios</span>
                        <p className="meta-value">{assignment.service_details?.length ?? 0}</p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-text">Este cuadrante no tiene asignaciones activas.</p>
              )}
            </div>
          ) : null}
        </article>
      </section>
    </>
  )
}