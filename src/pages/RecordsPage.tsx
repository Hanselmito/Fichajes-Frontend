import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { loadRecords } from '../services/resourceService'

type RecordsPageProps = {
  variant?: 'all' | 'recent'
}

function formatDateTime(value: string | null | undefined): { date: string, time: string } {
  if (!value) {
    return { date: 'Sin fecha', time: 'Sin hora' }
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: '' }
  }

  return {
    date: parsed.toLocaleDateString('es-ES'),
    time: parsed.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }
}

export function RecordsPage({ variant = 'all' }: RecordsPageProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>(variant === 'recent' ? 'pending' : 'all')
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null)

  const canConfirmRecords = user?.role === 'admin' || user?.role === 'coordinator'

  const recordsQuery = useQuery({
    queryKey: ['records'],
    queryFn: loadRecords,
  })

  const confirmMutation = useMutation({
    mutationFn: async (recordId: number) => {
      const result = await withAccessRefresh(() => apiClient.PUT('/records/{recordId}/confirm', {
        params: { path: { recordId } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo confirmar el fichaje'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setFeedback({ tone: 'success', message: 'Fichaje confirmado correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const records = recordsQuery.data ?? []
  const pendingRecords = records.filter((record) => !record.confirmed)
  const recentPendingRecords = pendingRecords.slice(0, 10)
  const recentRecords = [...records].sort((left, right) => {
    const leftTimestamp = left.timestamp ? new Date(left.timestamp).getTime() : 0
    const rightTimestamp = right.timestamp ? new Date(right.timestamp).getTime() : 0
    return rightTimestamp - leftTimestamp
  }).slice(0, 25)
  const sourceRecords = variant === 'recent' ? recentRecords : records

  const filteredRecords = sourceRecords.filter(record => 
    (!search || (record.employee_name && record.employee_name.toLowerCase().includes(search.toLowerCase())))
    && (statusFilter === 'all' || (statusFilter === 'pending' ? !record.confirmed : Boolean(record.confirmed)))
  )

  const title = variant === 'recent' ? '⏱️ Fichajes recientes' : '🗂️ Todos los Fichajes'
  const description = variant === 'recent'
    ? 'Revisa la actividad mas reciente y confirma los registros pendientes.'
    : 'Vista completa de fichajes de todos los empleados'

  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="text-muted text-spaced-after">{description}</p>

      {feedback ? <div className={`status-pill ${feedback.tone === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '1rem' }}>{feedback.message}</div> : null}

      <section className="metric-grid module-metric-grid" style={{ marginBottom: '1.5rem' }}>
        <article className="metric-card">
          <span>{variant === 'recent' ? 'Mostrados' : 'Total fichajes'}</span>
          <p className="metric-value">{variant === 'recent' ? sourceRecords.length : records.length}</p>
        </article>
        <article className="metric-card">
          <span>Pendientes</span>
          <p className="metric-value tone-warning">{pendingRecords.length}</p>
        </article>
        <article className="metric-card">
          <span>Confirmados</span>
          <p className="metric-value tone-success">{records.length - pendingRecords.length}</p>
        </article>
      </section>

      {canConfirmRecords && recentPendingRecords.length > 0 ? (
        <section className="table-card resource-shell-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-head-row">
            <div>
              <strong>Fichajes recientes pendientes</strong>
              <p className="table-note">Puedes confirmarlos manualmente; el sistema también los autocierra al superar el plazo configurado.</p>
            </div>
          </div>
          <div className="legacy-list-grid" style={{ marginTop: '1rem' }}>
            {recentPendingRecords.map((record) => {
              const { date, time } = formatDateTime(record.timestamp)
              return (
                <article className="legacy-list-card" key={`pending-${record.id}`}>
                  <div className="legacy-list-card-head">
                    <div>
                      <strong>{record.employee_name ?? 'Empleado sin nombre'}</strong>
                      <span>{record.type === 'entrada' ? 'Entrada' : 'Salida'} · {date} {time}</span>
                    </div>
                    <span className="status-pill warning">Pendiente</span>
                  </div>
                  <div className="legacy-detail-grid">
                    <div>
                      <span className="meta-label">Ubicación</span>
                      <p className="meta-value">{record.client_name ?? record.zone_name ?? record.device ?? 'Sin ubicación'}</p>
                    </div>
                    <div>
                      <span className="meta-label">Origen</span>
                      <p className="meta-value">{record.is_teletrabajo ? 'Teletrabajo' : 'Presencial'}</p>
                    </div>
                  </div>
                  <div className="inline-actions" style={{ marginTop: '1rem' }}>
                    <button className="primary-button" disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate(Number(record.id))} type="button">
                      Confirmar fichaje
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <div className="fichajes-toolbar">
        <label className="fichajes-toolbar-label">Buscar empleado:</label>
        <input 
          type="text" 
          className="fichajes-toolbar-input" 
          placeholder="Nombre del empleado..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="fichajes-toolbar-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmados</option>
        </select>
      </div>

      <div id="todosFichajesContent">
        {recordsQuery.isLoading ? <div className="loading">Cargando todos los fichajes...</div> : null}
        
        {recordsQuery.isError ? <div className="alert alert-error">Error al cargar fichajes</div> : null}

        {recordsQuery.data ? (
          filteredRecords.length === 0 ? (
            <p>No hay fichajes registrados para el filtro actual</p>
          ) : (
            <div className="table-responsive data-table-shell">
              <table id="fichajesTable" className="data-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" id="selectAll" /></th>
                    <th>ID</th>
                    <th>Empleado</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const { date, time } = formatDateTime(record.timestamp)
                    const location = record.is_teletrabajo ? '💻 Teletrabajo' : (record.client_name ?? record.zone_name ?? record.device ?? 'Sin ubicación')
                    
                    return (
                      <tr key={record.id} data-employee={(record.employee_name ?? '').toLowerCase()}>
                        <td data-label="Selección" className="table-selection-cell">
                          <input type="checkbox" className="fichaje-checkbox" value={record.id} />
                        </td>
                        <td data-label="ID" className="table-cell-subtle">{record.id}</td>
                        <td data-label="Empleado" className="table-cell-title">{record.employee_name ?? 'Sin nombre'}</td>
                        <td data-label="Fecha">{date}</td>
                        <td data-label="Hora">{time}</td>
                        <td data-label="Tipo">{record.type === 'entrada' ? '🟢 Entrada' : '🔴 Salida'}</td>
                        <td data-label="Ubicación" className="table-cell-subtle">{location}</td>
                        <td data-label="Estado">
                          {record.confirmed ? (
                            <span className="badge badge-success">Confirmado</span>
                          ) : (
                            <span className="badge badge-warning">Pendiente</span>
                          )}
                        </td>
                        <td data-label="Acciones" className="table-actions-cell">
                          <div className="table-actions">
                            {canConfirmRecords && !record.confirmed ? (
                              <button className="btn btn-primary btn-compact-action" disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate(Number(record.id))} type="button">Confirmar</button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
