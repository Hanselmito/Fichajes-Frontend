import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { loadClients } from '../services/resourceService'

export function ClientsPage() {
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: loadClients,
  })

  const clients = clientsQuery.data ?? []
  const activeClients = clients.filter((client) => Boolean(client.active)).length
  const offices = clients.filter((client) => Boolean(client.is_office)).length
  const geocoded = clients.filter((client) => client.latitude !== null && client.longitude !== null).length

  return (
    <>
      <PageHeader
        eyebrow="Clientes"
        subtitle="Listado operativo de clientes con direccion, zona, QR y estado geocodificado, siguiendo la composición del legacy de gestion."
        title="Base de clientes"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Total clientes</span>
          <p className="metric-value">{clients.length}</p>
        </article>
        <article className="metric-card">
          <span>Activos</span>
          <p className="metric-value tone-success">{activeClients}</p>
        </article>
        <article className="metric-card">
          <span>Oficinas</span>
          <p className="metric-value">{offices}</p>
        </article>
        <article className="metric-card">
          <span>Geocodificados</span>
          <p className="metric-value tone-warning">{geocoded}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Clientes visibles</strong>
            <p className="table-note">
              La vista respeta el alcance del backend y muestra cliente, contacto, zona y codigo QR de trabajo.
            </p>
          </div>
          <span className="status-pill">Legacy /clients</span>
        </div>

        {clientsQuery.isLoading ? <p className="empty-text">Cargando clientes...</p> : null}
        {clientsQuery.isError ? <div className="error-banner">{clientsQuery.error.message}</div> : null}

        {clients.length > 0 ? (
          <div className="legacy-list-grid">
            {clients.map((client) => (
              <article className="legacy-list-card" key={client.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.address ?? 'Sin direccion'}</span>
                  </div>
                  <span className={`status-pill ${client.active ? 'success' : 'danger'}`}>
                    {client.is_office ? 'oficina' : 'cliente'} · {client.active ? 'activo' : 'inactivo'}
                  </span>
                </div>

                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Zona</span>
                    <p className="meta-value">{client.zone_name ?? 'Sin zona'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Ciudad</span>
                    <p className="meta-value">{client.city ?? 'Sin ciudad'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Contacto</span>
                    <p className="meta-value">{client.phone ?? client.email ?? 'Sin contacto'}</p>
                  </div>
                  <div>
                    <span className="meta-label">QR</span>
                    <p className="meta-value">{client.qr_code ?? 'Sin QR'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  )
}