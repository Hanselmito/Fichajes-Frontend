import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { loadUsers, createUser, updateUser, deleteUser, loadZones } from '../services/resourceService'
import type { UserItem } from '../types/resources'
import { PageHeader } from '../components/PageHeader'

export function UsersPage() {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    dni: '',
    role: 'employee' as 'admin' | 'coordinator' | 'employee',
    zoneId: '' as number | '',
    active: true,
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: loadUsers,
  })

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: loadZones,
  })

  const users = usersQuery.data ?? []
  const zones = zonesQuery.data ?? []
  const activeUsers = users.filter((user) => Boolean(user.active)).length
  const ausencias = users.filter((user) => user.active === false).length // Aproximación

  const filteredUsers = users.filter(user => 
    !search || user.name.toLowerCase().includes(search.toLowerCase()) || 
    (user.zone_name && user.zone_name.toLowerCase().includes(search.toLowerCase()))
  )

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateUser>[1] }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleOpenForm = (user?: UserItem) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        password: '',
        name: user.name,
        email: user.email ?? '',
        phone: user.phone ?? '',
        dni: user.dni ?? '',
        role: user.role,
        zoneId: user.zone_id ?? '',
        active: user.active ?? true,
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        dni: '',
        role: 'employee',
        zoneId: '',
        active: true,
      })
    }
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setEditingUser(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSubmit = {
      ...formData,
      zoneId: formData.zoneId === '' ? null : Number(formData.zoneId),
    }

    if (editingUser?.id) {
      if (!dataToSubmit.password) delete (dataToSubmit as Partial<typeof dataToSubmit>).password;
      updateMutation.mutate({ id: editingUser.id, data: dataToSubmit })
    } else {
      createMutation.mutate(dataToSubmit)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      deleteMutation.mutate(id)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((chunk: string) => chunk[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <>
      {isFormVisible ? (
        <section className="table-card resource-shell-card" style={{ marginBottom: '2rem' }}>
          <div className="section-head-row">
            <div>
              <strong>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</strong>
              <p className="table-note">Completa los datos del trabajador.</p>
            </div>
            <button className="secondary-button" onClick={handleCloseForm} type="button">
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Nombre *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Usuario (Login) *</label>
                <input required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>{editingUser ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}</label>
                <input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>Teléfono</label>
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>DNI</label>
                <input value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>Rol *</label>
                <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof formData.role })}>
                  <option value="employee">Empleado</option>
                  <option value="coordinator">Coordinador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Zona</label>
                <select value={formData.zoneId} onChange={(e) => setFormData({ ...formData, zoneId: e.target.value === '' ? '' : Number(e.target.value) })}>
                  <option value="">Sin zona</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              {editingUser && (
                <div className="input-group" style={{ flex: '1 1 100px', display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                    Usuario Activo
                  </label>
                </div>
              )}
            </div>

            <div className="inline-actions" style={{ marginTop: '1rem' }}>
              <button className="primary-button" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="card employee-overview-shell">
        <div className="employee-overview-header">
          <div>
            <h2>👥 Vista de empleados</h2>
            <p>Resumen general con cliente actual, estado y proxima entrada.</p>
          </div>
          <div className="employee-overview-stats">
            <div className="employee-overview-stat"><strong>{users.length}</strong><span>Empleados</span></div>
            <div className="employee-overview-stat"><strong>{activeUsers}</strong><span>Activos</span></div>
            <div className="employee-overview-stat"><strong>{ausencias}</strong><span>Ausencias</span></div>
          </div>
        </div>

        <div className="employee-overview-toolbar">
          <input 
            type="search" 
            className="employee-overview-search" 
            placeholder="Buscar por empleado, cliente o zona..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          <select className="employee-overview-select">
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="pending">Pendiente de fichar</option>
          </select>
          <div className="employee-overview-actions">
            <button className="btn btn-primary" onClick={() => handleOpenForm()}>➕ Nuevo Coordinador</button>
            <button className="btn btn-primary" onClick={() => handleOpenForm()}>➕ Nuevo Empleado</button>
          </div>
        </div>

        {usersQuery.isLoading ? <div className="loading">Cargando vista de empleados...</div> : null}
        
        {usersQuery.data ? (
          <div id="employeeOverviewGrid">
            <div className="employee-overview-grid">
              {filteredUsers.map((user) => (
                <article className="employee-card-overview" key={user.id}>
                  <div className="employee-card-overview-head">
                    <div className="employee-card-avatar" aria-hidden="true">{getInitials(user.name)}</div>
                    <div className="employee-card-identity">
                      <h3>{user.name}</h3>
                      <p>{user.zone_name ?? 'Sin zona'}</p>
                    </div>
                    <div className="employee-card-menu-wrap">
                      <button type="button" className="employee-card-menu-btn" onClick={() => handleOpenForm(user)}>✏️</button>
                      <button type="button" className="employee-card-menu-btn" onClick={() => handleDelete(user.id)}>🗑️</button>
                    </div>
                  </div>
                  <div className="employee-card-overview-meta">
                    <span className={`employee-status-badge ${user.active ? 'tone-success' : 'tone-danger'}`}>
                      {user.role} - {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="employee-card-current-client">
                      {user.email}
                    </span>
                  </div>
                  <div className="employee-card-metrics">
                    <div className="employee-card-metric">
                      <span className="employee-card-metric-label">Horas esta semana</span>
                      <strong>{user.weekly_hours ?? 0}h</strong>
                      <div className="employee-card-progress"><span data-width="0"></span></div>
                    </div>
                    <div className="employee-card-metric">
                      <span className="employee-card-metric-label">Proxima entrada</span>
                      <strong>Sin turno asignado</strong>
                      <small>Ultimo QR cliente: --:--</small>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
