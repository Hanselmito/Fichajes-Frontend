import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { loadRecords } from '../services/resourceService'

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Sin fecha'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecordsPage() {
  const recordsQuery = useQuery({
    queryKey: ['records'],
    queryFn: loadRecords,
  })

  const records = recordsQuery.data ?? []
  const entries = records.filter((record) => record.type === 'entrada').length
  const exits = records.filter((record) => record.type === 'salida').length
  const pending = records.filter((record) => !record.confirmed).length

  return (
    <>
      <PageHeader
        eyebrow="Fichajes"
        subtitle="Vista real del modulo legacy de fichajes, con actividad reciente, estados y localizacion vinculada a cliente o zona."
        title="Registro horario"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Total cargados</span>
          <p className="metric-value">{records.length}</p>
        </article>
        <article className="metric-card">
          <span>Entradas</span>
          <p className="metric-value tone-success">{entries}</p>
        </article>
        <article className="metric-card">
          <span>Salidas</span>
          <p className="metric-value tone-warning">{exits}</p>
        </article>
        <article className="metric-card">
          <span>Pendientes</span>
          <p className="metric-value tone-danger">{pending}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Actividad reciente</strong>
            <p className="table-note">
              Se muestran los ultimos 100 fichajes permitidos por el backend para el usuario autenticado.
            </p>
          </div>
          <span className="status-pill">Legacy /records</span>
        </div>

        {recordsQuery.isLoading ? <p className="empty-text">Cargando fichajes...</p> : null}
        {recordsQuery.isError ? <div className="error-banner">{recordsQuery.error.message}</div> : null}

        {records.length > 0 ? (
          <div className="legacy-list-grid">
            {records.map((record) => (
              <article className="legacy-list-card" key={record.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{record.employee_name ?? 'Empleado sin nombre'}</strong>
                    <span>{record.client_name ?? record.zone_name ?? 'Sin ubicacion vinculada'}</span>
                  </div>
                  <span className={`status-pill ${record.confirmed ? 'success' : 'warning'}`}>
                    {record.type} · {record.confirmed ? 'confirmado' : 'pendiente'}
                  </span>
                </div>

                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Fecha</span>
                    <p className="meta-value">{formatDateTime(record.timestamp)}</p>
                  </div>
                  <div>
                    <span className="meta-label">Dispositivo</span>
                    <p className="meta-value">{record.device ?? 'Sin dispositivo'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Teletrabajo</span>
                    <p className="meta-value">{record.is_teletrabajo ? 'Si' : 'No'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Coordenadas</span>
                    <p className="meta-value">
                      {record.latitude ?? 0}, {record.longitude ?? 0}
                    </p>
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