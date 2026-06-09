import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { useAuth } from '../auth/useAuth'

interface ModificationRequest {
  id: number
  employee_id: number
  employee_name?: string | null
  status: string
  reason: string
  record_id: number | null
  original_timestamp?: string | null
  new_date?: string | null
  new_time?: string | null
}

export function ModificationsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canResolve = user?.role === 'admin' || user?.role === 'coordinator'
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [decisionTarget, setDecisionTarget] = useState<ModificationRequest | null>(null)
  const [decisionMode, setDecisionMode] = useState<'approve' | 'reject' | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null)

  const modificationsQuery = useQuery({
    queryKey: ['modifications'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/modifications/requests'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar modificaciones'))
      const data = result.data as unknown as { requests?: ModificationRequest[] } | ModificationRequest[]
      return (Array.isArray(data) ? data : data.requests) ?? []
    },
  })

  const approveMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const result = await withAccessRefresh(() => apiClient.PUT('/modifications/requests/{modificationRequestId}/approve', {
        params: { path: { modificationRequestId: id } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo aprobar la solicitud'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] })
      setDecisionTarget(null)
      setDecisionMode(null)
      setDecisionReason('')
      setFeedback({ tone: 'success', message: 'Solicitud aprobada correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const result = await withAccessRefresh(() => apiClient.PUT('/modifications/requests/{modificationRequestId}/reject', {
        params: { path: { modificationRequestId: id } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo rechazar la solicitud'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] })
      setDecisionTarget(null)
      setDecisionMode(null)
      setDecisionReason('')
      setFeedback({ tone: 'success', message: 'Solicitud rechazada correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const requests = modificationsQuery.data ?? []
  const visibleRequests = requests.filter((request) => statusFilter === 'all' || request.status === statusFilter)

  const openDecision = (request: ModificationRequest, mode: 'approve' | 'reject') => {
    setDecisionTarget(request)
    setDecisionMode(mode)
    setDecisionReason('')
  }

  const submitDecision = () => {
    if (!decisionTarget || !decisionMode) {
      return
    }

    if (decisionMode === 'approve') {
      approveMutation.mutate({ id: decisionTarget.id })
      return
    }

    rejectMutation.mutate({ id: decisionTarget.id })
  }

  return (
    <>
      <PageHeader
        eyebrow="Control Horario"
        subtitle="Aprobación o rechazo de peticiones de corrección de fichajes erróneos o faltantes."
        title="Peticiones de Modificación"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Peticiones Totales</span>
          <p className="metric-value">{requests.length}</p>
        </article>
        <article className="metric-card">
          <span>Pendientes</span>
          <p className="metric-value tone-warning">{requests.filter((request) => request.status === 'pending').length}</p>
        </article>
      </section>

      {feedback ? <div className={`status-pill ${feedback.tone === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '1rem' }}>{feedback.message}</div> : null}

      {decisionTarget && decisionMode ? (
        <section className="table-card resource-shell-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-head-row">
            <div>
              <strong>{decisionMode === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}</strong>
              <p className="table-note">Acción sobre la petición #{decisionTarget.id} de {decisionTarget.employee_name ?? `empleado ${decisionTarget.employee_id}`}.</p>
            </div>
            <button className="secondary-button" onClick={() => { setDecisionTarget(null); setDecisionMode(null); setDecisionReason('') }} type="button">Cancelar</button>
          </div>
          <div style={{ paddingTop: '1rem', display: 'grid', gap: '1rem' }}>
            <div className="input-group">
              <label>{decisionMode === 'approve' ? 'Comentario interno (opcional)' : 'Motivo del rechazo'}</label>
              <textarea value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} />
            </div>
            <div className="inline-actions">
              <button className="primary-button" disabled={approveMutation.isPending || rejectMutation.isPending} onClick={submitDecision} type="button">
                {decisionMode === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Listado de Peticiones</strong>
            <p className="table-note">Peticiones de los empleados para corregir sus marcajes.</p>
          </div>
          <div className="input-group" style={{ minWidth: '220px' }}>
            <label>Estado</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
            </select>
          </div>
        </div>

        {modificationsQuery.isLoading ? <p className="empty-text">Cargando peticiones...</p> : null}
        {modificationsQuery.isError ? (
          <div className="error-banner">{modificationsQuery.error.message}</div>
        ) : null}

        {visibleRequests.length > 0 ? (
          <div className="legacy-list-grid">
            {visibleRequests.map((req: ModificationRequest) => (
              <article className="legacy-list-card" key={req.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{req.employee_name || `Empleado ID: ${req.employee_id}`}</strong>
                    <span>{req.status || 'pendiente'}</span>
                  </div>
                  {canResolve && req.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="primary-button" onClick={() => openDecision(req, 'approve')} type="button">Aprobar</button>
                      <button className="secondary-button" onClick={() => openDecision(req, 'reject')} type="button" style={{ color: '#b42318', borderColor: '#fecaca' }}>Rechazar</button>
                    </div>
                  ) : <span className={`status-pill ${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}`}>{req.status}</span>}
                </div>
                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Motivo</span>
                    <p className="meta-value">{req.reason || '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Fichaje original</span>
                    <p className="meta-value">{req.record_id ? `#${req.record_id}` : 'Sin fichaje asociado'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Fecha original</span>
                    <p className="meta-value">{req.original_timestamp ? new Date(req.original_timestamp).toLocaleString() : '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Cambio solicitado</span>
                    <p className="meta-value">{req.new_date && req.new_time ? `${req.new_date} ${req.new_time}` : '---'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !modificationsQuery.isLoading && <p className="empty-text">No hay peticiones de modificación.</p>
        )}
      </section>
    </>
  )
}
