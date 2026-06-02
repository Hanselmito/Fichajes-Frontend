import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { sectionLabels } from '../config/navigation'
import brandMark from '../assets/brand-mark.svg'

export function AppShell() {
  const { user, capabilities, logout } = useAuth()

  const visibleSections = Object.entries(capabilities?.navigation ?? {})
    .filter(([, visible]) => visible)
    .filter(([key]) => !['dashboard'].includes(key))

  const visibleSectionCount = visibleSections.length + 3

  return (
    <div className="app-frame">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <img alt="Fichaje" className="brand-logo" src={brandMark} />
            <div className="brand-copy">
              <h1>Sistema de Fichaje</h1>
              <p>Frontend React inspirado en el panel legacy</p>
            </div>
          </div>

          <div className="header-search">
            <span className="header-search-icon">⌕</span>
            <input placeholder="Buscar modulo disponible" readOnly value="" />
          </div>

          <div className="user-info">
            <div className="header-action-group">
              <div className="header-action-btn header-user-trigger">
                <span className="header-user-avatar">
                  {user?.name
                    ?.split(' ')
                    .map((chunk: string) => chunk[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() ?? 'SA'}
                </span>
                <span className="header-user-copy">
                  <strong>{user?.name ?? 'Sesion activa'}</strong>
                  <small>
                    {user?.role} · {user?.zone_name ?? 'Sin zona'}
                  </small>
                </span>
              </div>

              <button
                className="secondary-button header-logout-button"
                onClick={() => void logout()}
                type="button"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container app-shell has-subtabs">
        <aside className="tabs sidebar">
          <div className="sidebar-header card">
            <span className="eyebrow">Sesion</span>
            <strong>{user?.name ?? 'Sesion activa'}</strong>
            <span>
              {visibleSectionCount} vistas activas · zona {user?.zone_name ?? 'sin zona'}
            </span>
          </div>

          <nav className="nav-grid card" id="mainTabs">
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

          <div className="panel card">
            <strong>Contrato activo</strong>
            <p className="panel-copy">
              Access token corto, refresh token rotatorio y capacidades reales por usuario.
            </p>
          </div>
        </aside>

        <main className="content-panel">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
