import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { sectionLabels } from '../config/navigation'
import { getSectionPath } from '../services/navigationService'

export function AppShell() {
  const { user, capabilities, logout } = useAuth()

  const visibleSections = Object.entries(capabilities?.navigation ?? {})
    .filter(([, visible]) => visible)
    .map(([key]) => key)

  return (
    <div id="app">
      <div id="mainApp" className="">
        <div className="container" id="mainContainer">
          <div className="header">
            <div className="header-content">
              <div className="header-brand">
                <div className="brand-mark" aria-hidden="true">SF</div>
                <div className="brand-copy">
                  <h1>Sistema de Fichaje</h1>
                  <p>Control horario profesional</p>
                </div>
              </div>

              <div className="header-search" aria-label="Buscar">
                <span className="header-search-icon" aria-hidden="true">⌕</span>
                <input type="search" id="headerSearch" placeholder="Buscar empleados, fichajes o reportes" readOnly />
              </div>

              <div className="user-info">
                <p id="userName" className="is-hidden"></p>
                <p id="userRole" className="is-hidden"></p>
                <div className="header-action-group">
                  <div className="header-action-wrap">
                    <button type="button" className="header-action-btn" aria-label="Notificaciones" aria-expanded="false">
                      <span aria-hidden="true">🔔</span>
                    </button>
                  </div>
                  <div className="header-action-wrap">
                    <button type="button" className="header-action-btn header-user-trigger" aria-label="Menú de usuario" aria-expanded="false">
                      <span className="header-user-avatar" id="headerAvatarInitial">
                        {user?.name?.split(' ').map((chunk: string) => chunk[0]).join('').slice(0, 2).toUpperCase() ?? 'SF'}
                      </span>
                      <span className="header-user-chevron" aria-hidden="true">▾</span>
                    </button>
                  </div>
                  <div className="header-action-wrap" style={{ marginLeft: '10px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => void logout()}>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs" id="mainTabs">
            {['coordinator', 'employee'].includes(user?.role ?? '') && visibleSections.includes('records') && (
              <NavLink className={({isActive}) => `tab-btn main-tab-btn ${isActive ? 'active' : ''}`} to="/records">
                <div className="main-tab-icon">⏱️</div>
                <span className="main-tab-label">Fichar</span>
              </NavLink>
            )}
            
            {visibleSections.includes('dashboard') && (
              <NavLink className={({isActive}) => `tab-btn main-tab-btn ${isActive ? 'active' : ''}`} to="/">
                <div className="main-tab-icon">👥</div>
                <span className="main-tab-label">{user?.role === 'employee' ? 'Mis Cosas' : 'Empleados'}</span>
              </NavLink>
            )}
            
            {visibleSections.includes('clients') && (
              <NavLink className={({isActive}) => `tab-btn main-tab-btn ${isActive ? 'active' : ''}`} to="/clients">
                <div className="main-tab-icon">👤</div>
                <span className="main-tab-label">Usuarios</span>
              </NavLink>
            )}
            
            {['admin', 'coordinator'].includes(user?.role ?? '') && visibleSections.includes('users') && (
              <NavLink className={({isActive}) => `tab-btn main-tab-btn ${isActive ? 'active' : ''}`} to="/users">
                <div className="main-tab-icon">⚙️</div>
                <span className="main-tab-label">Gestión</span>
              </NavLink>
            )}
            
            {['admin', 'coordinator'].includes(user?.role ?? '') && visibleSections.includes('calendars') && (
              <NavLink className={({isActive}) => `tab-btn main-tab-btn ${isActive ? 'active' : ''}`} to="/calendars">
                <div className="main-tab-icon">🗓️</div>
                <span className="main-tab-label">Calendario</span>
              </NavLink>
            )}
            
            {['admin', 'coordinator'].includes(user?.role ?? '') && visibleSections.includes('reports') && (
              <NavLink className={({isActive}) => `tab-btn main-tab-btn ${isActive ? 'active' : ''}`} to="/reports">
                <div className="main-tab-icon">📊</div>
                <span className="main-tab-label">Reportes</span>
              </NavLink>
            )}
            
            {user?.role === 'admin' && visibleSections.includes('zones') && (
              <NavLink className={({isActive}) => `tab-btn main-tab-btn ${isActive ? 'active' : ''}`} to="/zones">
                <div className="main-tab-icon">🗺️</div>
                <span className="main-tab-label">Zonas</span>
              </NavLink>
            )}
          </div>

          <div id="tabsContent">
            <div className="tab-content active" id="tabDashboard">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
