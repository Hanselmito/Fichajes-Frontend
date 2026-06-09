import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { loadClients, loadZones } from '../services/resourceService'
import { loadDashboard } from '../services/dashboardService'
import type { ClientItem } from '../types/resources'

export function ClientsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dni: '',
    address: '',
    postalCode: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    notes: '',
    zoneId: '' as number | '',
    isOffice: false,
    active: true,
  })

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: loadClients,
  })

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: loadZones,
  })

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: loadDashboard,
  })

  const clients = clientsQuery.data ?? []
  const zones = zonesQuery.data ?? []
  const dashboardEmployees = dashboardQuery.data?.employees ?? []
  const canDelete = user?.role === 'admin'

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await withAccessRefresh(() => apiClient.POST('/clients', {
        body: {
          name: formData.name,
          dni: formData.dni || null,
          address: formData.address,
          postalCode: formData.postalCode,
          city: formData.city,
          province: formData.province,
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.notes || null,
          zoneId: formData.zoneId === '' ? null : Number(formData.zoneId),
          isOffice: formData.isOffice,
        },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo crear el usuario'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const result = await withAccessRefresh(() => apiClient.PUT('/clients/{clientId}', {
        params: { path: { clientId } },
        body: {
          name: formData.name,
          dni: formData.dni || null,
          address: formData.address || null,
          postalCode: formData.postalCode || null,
          city: formData.city || null,
          province: formData.province || null,
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.notes || null,
          zoneId: formData.zoneId === '' ? null : Number(formData.zoneId),
          isOffice: formData.isOffice,
          active: formData.active,
        },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo actualizar el usuario'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const result = await withAccessRefresh(() => apiClient.DELETE('/clients/{clientId}', {
        params: { path: { clientId } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo eliminar el usuario'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  const regenerateQrMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const result = await withAccessRefresh(() => apiClient.POST('/clients/{clientId}/regenerate-qr', {
        params: { path: { clientId } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo regenerar el QR'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  const filteredClients = clients.filter((client) => {
    const assignedNames = dashboardEmployees
      .filter((employee) => employee.current_client_name === client.name || employee.next_assignment?.client_name === client.name)
      .map((employee) => employee.name)
      .join(' ')
      .toLowerCase()
    const matchesName = !search || (client.name || '').toLowerCase().includes(search.toLowerCase()) || assignedNames.includes(search.toLowerCase())
    const matchesZone = !zoneFilter || String(client.zone_id) === zoneFilter
    return matchesName && matchesZone
  })

  const getInitials = (name?: string) => {
    return (name || '??').split(' ').map((chunk: string) => chunk[0]).join('').slice(0, 2).toUpperCase()
  }

  const handleOpenForm = (client?: ClientItem) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name ?? '',
        dni: client.dni ?? '',
        address: client.address ?? '',
        postalCode: client.postal_code ?? '',
        city: client.city ?? '',
        province: client.province ?? '',
        phone: client.phone ?? '',
        email: client.email ?? '',
        notes: client.notes ?? '',
        zoneId: client.zone_id ?? '',
        isOffice: Boolean(client.is_office),
        active: Boolean(client.active),
      })
    } else {
      setEditingClient(null)
      setFormData({
        name: '',
        dni: '',
        address: '',
        postalCode: '',
        city: '',
        province: '',
        phone: '',
        email: '',
        notes: '',
        zoneId: '',
        isOffice: false,
        active: true,
      })
    }

    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setEditingClient(null)
    setIsFormVisible(false)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (editingClient?.id) {
      updateMutation.mutate(editingClient.id)
      return
    }

    createMutation.mutate()
  }

  const handleDelete = (client: ClientItem) => {
    if (!client.id) {
      return
    }

    if (window.confirm(`¿Eliminar el usuario ${client.name}?`)) {
      deleteMutation.mutate(client.id)
    }
  }

  const handleRegenerateQr = (client: ClientItem) => {
    if (!client.id) {
      return
    }

    regenerateQrMutation.mutate(client.id)
  }

  return (
    <div className="card employee-overview-shell client-overview-shell">
      {isFormVisible ? (
        <section className="table-card resource-shell-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-head-row">
            <div>
              <strong>{editingClient ? 'Editar usuario' : 'Nuevo usuario'}</strong>
              <p className="table-note">Gestiona los datos básicos, la zona y el tipo de centro o usuario.</p>
            </div>
            <button className="secondary-button" onClick={handleCloseForm} type="button">Cancelar</button>
          </div>

          <form onSubmit={handleSubmit} style={{ paddingTop: '1rem', display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '1 1 240px' }}>
                <label>Nombre *</label>
                <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 180px' }}>
                <label>DNI</label>
                <input value={formData.dni} onChange={(event) => setFormData({ ...formData, dni: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 180px' }}>
                <label>Zona</label>
                <select value={formData.zoneId} onChange={(event) => setFormData({ ...formData, zoneId: event.target.value === '' ? '' : Number(event.target.value) })}>
                  <option value="">Sin zona</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '2 1 320px' }}>
                <label>Dirección *</label>
                <input required value={formData.address} onChange={(event) => setFormData({ ...formData, address: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>Código postal *</label>
                <input required value={formData.postalCode} onChange={(event) => setFormData({ ...formData, postalCode: event.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '1 1 180px' }}>
                <label>Ciudad *</label>
                <input required value={formData.city} onChange={(event) => setFormData({ ...formData, city: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 180px' }}>
                <label>Provincia *</label>
                <input required value={formData.province} onChange={(event) => setFormData({ ...formData, province: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 180px' }}>
                <label>Teléfono</label>
                <input value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '1 1 220px' }}>
                <label>Email</label>
                <input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '0 0 180px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={formData.isOffice} onChange={(event) => setFormData({ ...formData, isOffice: event.target.checked })} style={{ width: 'auto', minHeight: 'auto' }} />
                  Es centro operativo
                </label>
              </div>
              {editingClient ? (
                <div className="input-group" style={{ flex: '0 0 180px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={formData.active} onChange={(event) => setFormData({ ...formData, active: event.target.checked })} style={{ width: 'auto', minHeight: 'auto' }} />
                    Activo en sistema
                  </label>
                </div>
              ) : null}
            </div>

            <div className="input-group">
              <label>Notas</label>
              <textarea value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} />
            </div>

            <div className="inline-actions">
              <button className="primary-button" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
                {editingClient ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="gestion-section-header">
        <div>
          <h2 className="section-title-reset">👤 Vista Usuarios</h2>
          <p className="client-overview-subtitle">Resumen visual de usuarios, asignaciones y accesos directos.</p>
        </div>
        {!isFormVisible ? <button className="btn btn-primary" onClick={() => handleOpenForm()}>➕ Nuevo Usuario</button> : null}
      </div>

      <div className="gestion-filters-row">
        <input
          type="search"
          placeholder="Buscar usuario..."
          className="gestion-filter-input gestion-filter-input-grow"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="gestion-filter-input"
          value={zoneFilter}
          onChange={(event) => setZoneFilter(event.target.value)}
        >
          <option value="">Todas las zonas</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>{zone.name}</option>
          ))}
        </select>
      </div>

      {clientsQuery.isLoading ? <div className="loading">Cargando vista de usuarios...</div> : null}
      {clientsQuery.isError ? <div className="alert alert-error">Error al cargar usuarios</div> : null}

      {clientsQuery.data ? (
        filteredClients.length === 0 ? (
          <div className="employee-overview-empty">No hay usuarios que coincidan con los filtros actuales.</div>
        ) : (
          <div id="clientOverviewResults">
            <div className="employee-overview-grid">
              {filteredClients.map((client) => (
                <article className="employee-card-overview client-overview-card" key={client.id}>
                  {(() => {
                    const assignedEmployees = dashboardEmployees.filter((employee) => employee.current_client_name === client.name || employee.next_assignment?.client_name === client.name)
                    return (
                      <>
                  <div className="employee-card-overview-head">
                    <div className="employee-card-avatar" aria-hidden="true">{getInitials(client.name)}</div>
                    <div className="employee-card-identity">
                      <h3>{client.name}</h3>
                      <p>{client.zone_name ?? 'Sin zona'}</p>
                    </div>
                    <div className="client-overview-head-actions">
                      <span className="client-overview-type-badge">{client.is_office ? 'Centro' : 'Usuario'}</span>
                      <div className="employee-card-menu-wrap">
                        <button type="button" className="employee-card-menu-btn" onClick={() => handleOpenForm(client)}>✏️</button>
                        {canDelete ? <button type="button" className="employee-card-menu-btn" onClick={() => handleDelete(client)}>🗑️</button> : null}
                      </div>
                    </div>
                  </div>

                  <div className="employee-card-overview-meta">
                    <span className={`employee-status-badge ${client.active ? 'tone-info' : 'tone-muted'}`}>
                      {client.active ? 'Activo en sistema' : 'Inactivo'}
                    </span>
                    <span className="employee-card-current-client">
                      QR actual: <strong>{client.qr_code ?? 'Sin QR'}</strong>
                    </span>
                  </div>

                  <div className="client-overview-detail-list">
                    <span className="client-overview-phone-badge">
                      📞 {client.phone ?? 'Sin telefono'}
                    </span>
                    <div className="client-overview-detail">
                      <span>Asignaciones reales</span>
                      <strong className="client-overview-assigned-list">
                        {assignedEmployees.length > 0 ? assignedEmployees.slice(0, 3).map((employee) => <span key={employee.id}>{employee.name}</span>) : <span>Sin asignaciones activas</span>}
                      </strong>
                    </div>
                    <div className="client-overview-detail">
                      <span>Correo</span>
                      <strong>{client.email ?? 'Sin email'}</strong>
                    </div>
                    <div className="client-overview-detail">
                      <span>Direccion</span>
                      <strong>{client.address ? `${client.address}${client.city ? ', ' + client.city : ''}` : 'Sin direccion'}</strong>
                    </div>
                    <div className="client-overview-detail">
                      <span>Necesidades / notas</span>
                      <strong>{client.notes ? String(client.notes).trim() : 'Sin necesidades registradas'}</strong>
                    </div>
                  </div>

                  <div className="employee-card-metrics">
                    <div className="employee-card-metric">
                      <span className="employee-card-metric-label">Tipo</span>
                      <strong>{client.is_office ? 'Centro' : 'Usuario'}</strong>
                      <small>{client.zone_name ?? 'Sin zona asignada'}</small>
                    </div>
                    <div className="employee-card-metric">
                      <span className="employee-card-metric-label">Asignados</span>
                      <strong>{assignedEmployees.length}</strong>
                      <small>{client.city ?? 'Sin ciudad'} · {client.province ?? 'Sin provincia'}</small>
                    </div>
                  </div>

                  <div className="employee-card-actions">
                    <button type="button" className="btn btn-primary employee-card-action" onClick={() => handleRegenerateQr(client)}>Regenerar QR</button>
                    <button type="button" className="btn btn-secondary employee-card-action" onClick={() => navigate(`/quadrants?clientId=${client.id}&clientName=${encodeURIComponent(client.name ?? '')}`)}>Ver cuadrante</button>
                  </div>
                      </>
                    )
                  })()}
                </article>
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}
