import { useQuery } from '@tanstack/react-query'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { useAuth } from '../auth/useAuth'
import type { paths } from '../api/generated'

type DashboardResponse =
  paths['/dashboard']['get']['responses']['200']['content']['application/json']

async function loadDashboard(): Promise<DashboardResponse> {
  const result = await withAccessRefresh(() => apiClient.GET('/dashboard'))

  if (result.error || !result.data?.success) {
    throw new Error(getErrorMessage(result.error, 'No se pudo cargar el dashboard'))
  }

  return result.data
}

export function DashboardPage() {
  const { capabilities, user } = useAuth()
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: loadDashboard,
  })
  const todaySummary = dashboardQuery.data?.checkins_summary?.today
  const historySummary = dashboardQuery.data?.checkins_summary?.history ?? []

  const visibleSections = Object.entries(capabilities?.navigation ?? {})
    .filter(([, visible]) => visible)
    .map(([key]) => key)

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Operativo</span>
          <h1 className="page-title">Dashboard de arranque</h1>
          <p className="page-subtitle">
            Estado inicial del backend conectado para el usuario {user?.name}. Esta pantalla ya
            consume `GET /dashboard` y refleja la superficie visible segun permisos reales.
          </p>
        </div>

        <a className="ghost-link" href="https://react.dev" rel="noreferrer" target="_blank">
          React stack
        </a>
      </header>

      <section className="metric-grid">
        <article className="metric-card">
          <span>Personas listadas</span>
          <p className="metric-value">{dashboardQuery.data?.total ?? '—'}</p>
        </article>
        <article className="metric-card">
          <span>Trabajando</span>
          <p className="metric-value tone-success">{dashboardQuery.data?.trabajando ?? '—'}</p>
        </article>
        <article className="metric-card">
          <span>Ausentes</span>
          <p className="metric-value tone-warning">{dashboardQuery.data?.ausente ?? '—'}</p>
        </article>
        <article className="metric-card">
          <span>Vacaciones</span>
          <p className="metric-value tone-danger">{dashboardQuery.data?.vacaciones ?? '—'}</p>
        </article>
      </section>

      <section className="section-grid">
        <article className="section-card">
          <strong>Capacidades visibles</strong>
          <p className="panel-copy">
            {visibleSections.length} secciones activas para este usuario.
          </p>
          <div className="capability-grid">
            {visibleSections.map((section) => (
              <span className="status-pill" key={section}>
                {section}
              </span>
            ))}
          </div>
        </article>

        <article className="section-card">
          <strong>Checkins recientes</strong>
          <p className="panel-copy">
            Hoy: {todaySummary?.total ?? 0} fichajes · pendientes: {todaySummary?.pending ?? 0}
          </p>
          <div className="capability-grid">
            {historySummary.map((entry) => (
              <div className="panel" key={entry.date}>
                <strong>{entry.label}</strong>
                <span className="meta-value">
                  {entry.total} total · {entry.pending} pendientes
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="table-card">
        <strong>Resumen de empleados</strong>
        <p className="table-note">
          Vista inicial para verificar que el frontend ya entiende el payload real del dashboard.
        </p>

        {dashboardQuery.isLoading ? <p className="empty-text">Cargando dashboard...</p> : null}
        {dashboardQuery.isError ? (
          <div className="error-banner">{dashboardQuery.error.message}</div>
        ) : null}

        {dashboardQuery.data ? (
          <table className="employee-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Estado</th>
                <th>Cliente actual</th>
                <th>Siguiente visita</th>
                <th>Horas semana</th>
              </tr>
            </thead>
            <tbody>
              {dashboardQuery.data.employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="meta-stack">
                      <span className="employee-name">{employee.name}</span>
                      <span>{employee.role}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${employee.status_display_tone}`}>
                      {employee.status_display_label}
                    </span>
                  </td>
                  <td>{employee.current_client_name ?? 'Sin visita en curso'}</td>
                  <td>
                    {employee.next_assignment
                      ? `${employee.next_assignment.client_name} · ${employee.next_assignment.start_time}`
                      : 'Sin proxima asignacion'}
                  </td>
                  <td>{employee.hours_worked_week}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </>
  )
}
