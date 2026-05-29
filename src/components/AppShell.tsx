import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const sectionLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  records: 'Fichajes',
  reports: 'Reportes',
  vacations: 'Vacaciones legacy',
  vacation_requests: 'Solicitudes de vacaciones',
  user_overview: 'Resumen de empleados',
  zones: 'Zonas',
  users: 'Usuarios',
  clients: 'Clientes',
  quadrants: 'Cuadrantes',
  schedules: 'Horarios',
  employee_schedules: 'Historial de horarios',
  services: 'Servicios',
  calendars: 'Calendarios',
  zone_holidays: 'Festivos de zona',
  tolerance: 'Tolerancias',
  bolsa_anotaciones: 'Bolsa de horas',
  notifications: 'Notificaciones',
  breaks: 'Descansos',
  modifications: 'Modificaciones',
}

export function AppShell() {
  const { user, capabilities, logout } = useAuth()

  const visibleSections = Object.entries(capabilities?.navigation ?? {})
    .filter(([, visible]) => visible)
    .filter(([key]) => !['dashboard'].includes(key))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="eyebrow">Fichaje frontend</span>
          <strong>{user?.name ?? 'Sesion activa'}</strong>
          <span>
            {user?.role} · zona {user?.zone_name ?? 'sin zona'}
          </span>
        </div>

        <nav className="nav-grid">
          <NavLink className="nav-link" to="/">
            Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/contract">
            Contrato API
          </NavLink>
          <NavLink className="nav-link" to="/readiness">
            Readiness backend
          </NavLink>

          {visibleSections.map(([key]) => (
            <NavLink className="nav-link" key={key} to={`/workspace/${key}`}>
              {sectionLabels[key] ?? key}
            </NavLink>
          ))}
        </nav>

        <div className="panel">
          <strong>Contrato activo</strong>
          <p className="panel-copy">
            El cliente usa bearer token, `me`, `capabilities` y tipos generados desde OpenAPI.
          </p>
        </div>

        <button className="secondary-button" onClick={() => void logout()} type="button">
          Cerrar sesion
        </button>
      </aside>

      <main className="content-panel">
        <Outlet />
      </main>
    </div>
  )
}
