import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loadClients, loadZones } from '../services/resourceService'

export function ClientsPage() {
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: loadClients,
  })

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: loadZones,
  })

  const clients = clientsQuery.data ?? []
  const zones = zonesQuery.data ?? []

  const filteredClients = clients.filter((client) => {
    const matchesName = !search || (client.name || '').toLowerCase().includes(search.toLowerCase())
    const matchesZone = !zoneFilter || String(client.zone_id) === zoneFilter
    return matchesName && matchesZone
  })

  const getInitials = (name?: string) => {
    return (name || '??').split(' ').map((chunk: string) => chunk[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="card employee-overview-shell client-overview-shell">
      <div className="gestion-section-header">
        <div>
          <h2 className="section-title-reset">👤 Vista Usuarios</h2>
          <p className="client-overview-subtitle">Resumen visual de usuarios, asignaciones y accesos directos.</p>
        </div>
        <button className="btn btn-primary">➕ Nuevo Usuario</button>
      </div>

      <div className="gestion-filters-row">
        <input 
          type="search" 
          placeholder="Buscar usuario..." 
          className="gestion-filter-input gestion-filter-input-grow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="gestion-filter-input"
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
        >
          <option value="">Todas las zonas</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
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
                  <div className="employee-card-overview-head">
                    <div className="employee-card-avatar" aria-hidden="true">{getInitials(client.name)}</div>
                    <div className="employee-card-identity">
                      <h3>{client.name}</h3>
                      <p>{client.zone_name ?? 'Sin zona'}</p>
                    </div>
                    <div className="client-overview-head-actions">
                      <span className="client-overview-type-badge">{client.is_office ? 'Centro' : 'Usuario'}</span>
                      <div className="employee-card-menu-wrap">
                        <button type="button" className="employee-card-menu-btn">✏️</button>
                        <button type="button" className="employee-card-menu-btn">🗑️</button>
                      </div>
                    </div>
                  </div>

                  <div className="employee-card-overview-meta">
                    <span className={`employee-status-badge ${client.active ? 'tone-info' : 'tone-muted'}`}>
                      {client.active ? 'Activo en sistema' : 'Inactivo'}
                    </span>
                    <span className="employee-card-current-client">
                      Acompañamiento: Sin asignar
                    </span>
                  </div>

                  <div className="client-overview-detail-list">
                    <span className="client-overview-phone-badge">
                      📞 {client.phone ?? 'Sin telefono'}
                    </span>
                    <div className="client-overview-detail">
                      <span>Empleado asignado</span>
                      <strong className="client-overview-assigned-list">
                        <span>Sin asignar</span>
                      </strong>
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
                      <span className="employee-card-metric-label">Horas semanales</span>
                      <strong>0h 00m</strong>
                      <small>Sin horas planificadas</small>
                    </div>
                    <div className="employee-card-metric">
                      <span className="employee-card-metric-label">Proxima entrada</span>
                      <strong>Sin turno</strong>
                      <small>Sin proxima visita planificada</small>
                    </div>
                  </div>

                  <div className="employee-card-actions">
                    <button type="button" className="btn btn-primary employee-card-action">QR</button>
                    <button type="button" className="btn btn-secondary employee-card-action">Ver cuadrante</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}
