import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useState } from 'react'

export function AppShell() {
  const { user, capabilities, logout } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false)
  const location = useLocation()
  const path = location.pathname

  const visibleSections = Object.entries(capabilities?.navigation ?? {})
    .filter(([, visible]) => visible)
    .map(([key]) => key)

  const isFicharGroup = path.startsWith('/fichar') || path.startsWith('/records')
  const isMisCosasGroup = path === '/' || path.startsWith('/bolsa-anotaciones') || path.startsWith('/vacations') || path.startsWith('/quadrants')

  return (
    <div id="app">
      <div id="mainApp">
        {/* SOLUCIÓN AL ERROR DE VISTA: has-subtabs DEBE ir en .container para que el CSS Grid baje el contenido */}
        <div className={`container ${isFicharGroup || isMisCosasGroup ? 'has-subtabs' : ''}`} id="mainContainer">
          
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
                <div className="header-action-group">
                  
                  {/* Botón Notificaciones */}
                  <div className="header-action-wrap">
                    <button 
                      type="button" 
                      className={`header-action-btn ${isNotifMenuOpen ? 'active' : ''}`}
                      onClick={() => { setIsNotifMenuOpen(!isNotifMenuOpen); setIsUserMenuOpen(false); }}
                      aria-label="Notificaciones" 
                      aria-expanded={isNotifMenuOpen}
                    >
                      <span aria-hidden="true">🔔</span>
                      <span className="notification-badge is-hidden" id="notificationBadge">0</span>
                    </button>
                    {isNotifMenuOpen && (
                      <div className="header-popover header-notifications-panel active" id="notificationsPanel">
                        <div className="header-popover-head">
                            <div>
                                <strong>Notificaciones</strong>
                                <small>Mensajes recientes del sistema</small>
                            </div>
                            <button type="button" className="header-inline-btn" onClick={() => setIsNotifMenuOpen(false)}>Marcar vistas</button>
                        </div>
                        <div className="header-notifications-list" id="notificationsList">
                            <div className="header-empty-state">No hay notificaciones pendientes.</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Menú de Usuario */}
                  <div className="header-action-wrap">
                    <button 
                      type="button" 
                      className={`header-action-btn header-user-trigger ${isUserMenuOpen ? 'active' : ''}`}
                      onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotifMenuOpen(false); }}
                      aria-label="Menú de usuario" 
                      aria-expanded={isUserMenuOpen}
                    >
                      <span className="header-user-avatar" id="headerAvatarInitial">
                        {user?.name?.split(' ').map((chunk: string) => chunk[0]).join('').slice(0, 2).toUpperCase() ?? 'SF'}
                      </span>
                      <span className="header-user-chevron" aria-hidden="true">▾</span>
                    </button>
                    
                    {isUserMenuOpen && (
                      <div className="header-popover header-user-menu active" id="userMenuPanel">
                        <div className="header-profile-summary">
                          <div className="header-profile-avatar" id="headerMenuAvatar">
                            {user?.name?.split(' ').map((chunk: string) => chunk[0]).join('').slice(0, 2).toUpperCase() ?? 'SF'}
                          </div>
                          <div>
                            <strong id="headerMenuUserName">{user?.name ?? 'Usuario'}</strong>
                            <span id="headerMenuUserRole">{user?.role === 'admin' ? '👑 Administrador' : user?.role === 'coordinator' ? '👔 Coordinador' : '👷 Empleado'}</span>
                          </div>
                        </div>
                        <div className="header-menu-stats">
                          <div className="header-menu-stat">
                            <span>Horas semanales</span>
                            <strong id="headerWeeklyHours">{user?.weekly_hours ?? '0.0'}h</strong>
                          </div>
                        </div>
                        <div id="workHoursProgress" className="header-hours-progress">
                          <div className="header-hours-progress-top">
                            <span id="workHoursText">{user?.weekly_hours ?? '0.0'}h / {user?.weekly_hours ?? '0.0'}h</span>
                            <span id="workHoursPercent">0%</span>
                          </div>
                          <div className="header-hours-progress-track">
                            <div id="workHoursBar" style={{ width: '0%', backgroundColor: '#ff5252' }}></div>
                          </div>
                        </div>
                        <button type="button" className="header-menu-button" onClick={() => { alert('Mensajes disponible próximamente'); setIsUserMenuOpen(false); }}>Mensajes</button>
                        <button type="button" className="header-menu-button" onClick={() => { alert('Configuración disponible próximamente'); setIsUserMenuOpen(false); }}>Configuración</button>
                        <button type="button" className="header-menu-button header-menu-button-danger" onClick={() => void logout()}>Cerrar sesión</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs" id="mainTabs">
            {['coordinator', 'employee'].includes(user?.role ?? '') && visibleSections.includes('records') && (
              <NavLink className={`tab-btn main-tab-btn ${isFicharGroup ? 'active' : ''}`} to="/fichar">
                <div className="main-tab-icon">⏱️</div>
                <span className="main-tab-label">Fichar</span>
              </NavLink>
            )}
            
            {visibleSections.includes('dashboard') && (
              <NavLink className={`tab-btn main-tab-btn ${isMisCosasGroup ? 'active' : ''}`} to="/">
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

          <div className="subtabs" id="subTabs">
            {isFicharGroup && (
              <>
                <NavLink className={({isActive}) => `subtab-btn ${isActive ? 'active' : ''}`} to="/fichar">Fichar</NavLink>
                <NavLink className={({isActive}) => `subtab-btn ${isActive ? 'active' : ''}`} to="/records">{user?.role === 'employee' ? 'Mis Fichajes' : 'Todos los Fichajes'}</NavLink>
              </>
            )}
            {isMisCosasGroup && user?.role === 'employee' && (
              <>
                <NavLink className={({isActive}) => `subtab-btn ${isActive ? 'active' : ''}`} to="/bolsa-anotaciones">Mi Bolsa de Horas</NavLink>
                <NavLink className={({isActive}) => `subtab-btn ${isActive ? 'active' : ''}`} to="/vacations">Vacaciones</NavLink>
                <NavLink className={({isActive}) => `subtab-btn ${isActive ? 'active' : ''}`} to="/quadrants">Mi Cuadrante</NavLink>
              </>
            )}
            {isMisCosasGroup && ['admin', 'coordinator'].includes(user?.role ?? '') && (
              <>
                <NavLink className={`subtab-btn ${path === '/' ? 'active' : ''}`} to="/">Dashboard</NavLink>
                <NavLink className={({isActive}) => `subtab-btn ${isActive ? 'active' : ''}`} to="/bolsa-anotaciones">Bolsa de horas</NavLink>
                <NavLink className={({isActive}) => `subtab-btn ${isActive ? 'active' : ''}`} to="/vacations">Vacaciones</NavLink>
              </>
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