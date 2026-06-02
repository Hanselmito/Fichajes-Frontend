import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { loadUsers } from '../services/resourceService'

export function UsersPage() {
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: loadUsers,
  })

  const users = usersQuery.data ?? []
  const activeUsers = users.filter((user) => Boolean(user.active)).length
  const coordinators = users.filter((user) => user.role === 'coordinator').length
  const employees = users.filter((user) => user.role === 'employee').length

  return (
    <>
      <PageHeader
        eyebrow="Usuarios"
        subtitle="Panel de usuarios con la misma lectura de tarjetas, etiquetas y metadatos operativos del legacy administrativo."
        title="Gestion de usuarios"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Total usuarios</span>
          <p className="metric-value">{users.length}</p>
        </article>
        <article className="metric-card">
          <span>Activos</span>
          <p className="metric-value tone-success">{activeUsers}</p>
        </article>
        <article className="metric-card">
          <span>Coordinadores</span>
          <p className="metric-value">{coordinators}</p>
        </article>
        <article className="metric-card">
          <span>Empleados</span>
          <p className="metric-value tone-warning">{employees}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Personas y permisos</strong>
            <p className="table-note">
              Datos procedentes de /users, incluyendo zona, calendario y banderas de permisos serializadas por el backend.
            </p>
          </div>
          <span className="status-pill">Legacy /users</span>
        </div>

        {usersQuery.isLoading ? <p className="empty-text">Cargando usuarios...</p> : null}
        {usersQuery.isError ? <div className="error-banner">{usersQuery.error.message}</div> : null}

        {users.length > 0 ? (
          <div className="legacy-list-grid">
            {users.map((user) => (
              <article className="legacy-list-card" key={user.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{user.name}</strong>
                    <span>
                      @{user.username} · {user.email}
                    </span>
                  </div>
                  <span className={`status-pill ${user.active ? 'success' : 'danger'}`}>
                    {user.role} · {user.active ? 'activo' : 'inactivo'}
                  </span>
                </div>

                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Zona</span>
                    <p className="meta-value">{user.zone_name ?? 'Sin zona'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Calendario</span>
                    <p className="meta-value">{user.calendar_name ?? 'Sin calendario'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Horas semanales</span>
                    <p className="meta-value">{user.weekly_hours ?? 0}h</p>
                  </div>
                  <div>
                    <span className="meta-label">Telefono</span>
                    <p className="meta-value">{user.phone ?? 'Sin telefono'}</p>
                  </div>
                </div>

                <div className="capability-grid compact-pill-grid">
                  {user.can_view_reports ? <span className="status-pill">Reportes</span> : null}
                  {user.can_view_all_records ? <span className="status-pill">Todos fichajes</span> : null}
                  {user.can_view_user_overview ? <span className="status-pill">Resumen usuarios</span> : null}
                  {user.can_view_all_vacations ? <span className="status-pill">Vacaciones globales</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  )
}