import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { loadUsers, createUser, updateUser, deleteUser, loadZones } from '../services/resourceService'
import type { UserItem } from '../types/resources'

export function UsersPage() {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)

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
  const coordinators = users.filter((user) => user.role === 'coordinator').length
  const employees = users.filter((user) => user.role === 'employee').length

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
      // Remove password if not changing
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

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Personas y permisos</strong>
            <p className="table-note">
              Datos procedentes de /users, incluyendo zona, calendario y banderas de permisos serializadas por el backend.
            </p>
          </div>
          {!isFormVisible && (
            <button className="primary-button" onClick={() => handleOpenForm()} type="button">
              + Nuevo Usuario
            </button>
          )}
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
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`status-pill ${user.active ? 'success' : 'danger'}`}>
                      {user.role} · {user.active ? 'activo' : 'inactivo'}
                    </span>
                    <button
                      className="secondary-button"
                      onClick={() => handleOpenForm(user)}
                      type="button"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Editar
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => handleDelete(user.id)}
                      type="button"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#e53e3e', borderColor: '#fc8181' }}
                    >
                      Eliminar
                    </button>
                  </div>
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
