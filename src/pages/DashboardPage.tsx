import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { loadDashboard } from '../services/dashboardService'
import { PageHeader } from '../components/PageHeader'
import { DashboardEmployeeCard } from '../components/DashboardEmployeeCard'

export function DashboardPage() {
  const { capabilities, user } = useAuth()
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: loadDashboard,
  })
  const todaySummary = dashboardQuery.data?.checkins_summary?.today
  const historySummary = dashboardQuery.data?.checkins_summary?.history ?? []
  const employeeCards = dashboardQuery.data?.employees.slice(0, 6) ?? []

  const visibleSections = Object.entries(capabilities?.navigation ?? {})
    .filter(([, visible]) => visible)
    .map(([key]) => key)

  return (
    <>
      <PageHeader
        action={
          <span className="ghost-link dashboard-scope-pill">
            {visibleSections.length} modulos visibles
          </span>
        }
        eyebrow="Operativo"
        subtitle={`Estado inicial del backend conectado para ${user?.name}. Esta vista se apoya en los datos reales de GET /dashboard y en el lenguaje visual del panel legacy.`}
        title="Panel general"
      />

      <section className="metric-grid">
        <article className="metric-card">
          <span>Total empleados</span>
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

      <section className="legacy-dashboard-grid">
        <article className="section-card section-card-highlight">
          <strong>Resumen operativo del dia</strong>
          <p className="panel-copy">
            Hoy: {todaySummary?.total ?? 0} fichajes confirmados · pendientes: {todaySummary?.pending ?? 0}
          </p>

          <div className="history-strip">
            {historySummary.map((entry) => (
              <div className="history-strip-item" key={entry.date}>
                <strong>{entry.total}</strong>
                <span>{entry.label}</span>
                <small>{entry.pending} pendientes</small>
              </div>
            ))}
          </div>
        </article>

        <article className="section-card">
          <strong>Navegacion permitida</strong>
          <p className="panel-copy">
            Secciones efectivamente visibles para este rol y este alcance de zona.
          </p>
          <div className="capability-grid">
            {visibleSections.map((section) => (
              <span className="status-pill" key={section}>
                {section}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="table-card">
        <div className="section-head-row">
          <div>
            <strong>Resumen de empleados</strong>
            <p className="table-note">
              Tarjetas operativas inspiradas en el overview del panel original.
            </p>
          </div>
          <span className="status-pill">{dashboardQuery.data?.employees.length ?? 0} visibles</span>
        </div>

        {dashboardQuery.isLoading ? <p className="empty-text">Cargando dashboard...</p> : null}
        {dashboardQuery.isError ? (
          <div className="error-banner">{dashboardQuery.error.message}</div>
        ) : null}

        {dashboardQuery.data ? (
          <div className="employee-overview-grid-list">
            {employeeCards.map((employee) => (
              <DashboardEmployeeCard employee={employee} key={employee.id} />
            ))}
          </div>
        ) : null}
      </section>
    </>
  )
}
