import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import {
  loadVacationRequests,
  approveVacationRequest,
  rejectVacationRequest,
  loadVacations,
  deleteVacation,
  createVacationRequest,
} from '../services/resourceService'
import { useAuth } from '../auth/useAuth'

export function VacationsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'requests' | 'confirmed'>('requests')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null)
  const [decision, setDecision] = useState<{ type: 'approve' | 'reject' | 'delete'; id: number } | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [formData, setFormData] = useState({
    type: 'vacaciones' as 'vacaciones' | 'asuntos_propios',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const requestsQuery = useQuery({
    queryKey: ['vacationRequests'],
    queryFn: loadVacationRequests,
  })

  const vacationsQuery = useQuery({
    queryKey: ['vacations'],
    queryFn: loadVacations,
  })

  const requests = requestsQuery.data ?? []
  const vacations = vacationsQuery.data ?? []

  // If the user is an admin, they see all pending requests.
  // If the user is an employee/coordinator, they only see their own requests.
  // Assuming the backend handles this filtering, we just take the results.
  const pendingRequests = requests.filter(r => r.status === 'pendiente')

  const createMutation = useMutation({
    mutationFn: createVacationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacationRequests'] })
      setIsFormVisible(false)
      setFormData({ type: 'vacaciones', startDate: '', endDate: '', reason: '' })
      setFeedback({ tone: 'success', message: 'Solicitud enviada con éxito.' })
    },
    onError: (error: Error) => {
      setFeedback({ tone: 'danger', message: error.message })
    }
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => approveVacationRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacationRequests'] })
      queryClient.invalidateQueries({ queryKey: ['vacations'] })
      setDecision(null)
      setDecisionReason('')
      setFeedback({ tone: 'success', message: 'Solicitud aprobada correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectVacationRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacationRequests'] })
      setDecision(null)
      setDecisionReason('')
      setFeedback({ tone: 'success', message: 'Solicitud rechazada correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const deleteVacationMutation = useMutation({
    mutationFn: deleteVacation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] })
      setDecision(null)
      setDecisionReason('')
      setFeedback({ tone: 'success', message: 'Vacación eliminada correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const handleApprove = (id: number) => setDecision({ type: 'approve', id })
  const handleReject = (id: number) => setDecision({ type: 'reject', id })
  const handleDeleteVacation = (id: number) => setDecision({ type: 'delete', id })

  const handleDecisionSubmit = () => {
    if (!decision) return

    if (decision.type === 'approve') {
      approveMutation.mutate({ id: decision.id, reason: decisionReason })
      return
    }

    if (decision.type === 'reject') {
      rejectMutation.mutate({ id: decision.id, reason: decisionReason })
      return
    }

    deleteVacationMutation.mutate(decision.id)
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <>
      <PageHeader
        eyebrow="Vacaciones"
        subtitle="Gestión de solicitudes pendientes y calendario de vacaciones confirmadas."
        title="Vacaciones y Solicitudes"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card" onClick={() => setActiveTab('requests')} style={{ cursor: 'pointer', border: activeTab === 'requests' ? '2px solid #3182ce' : undefined }}>
          <span>Solicitudes Pendientes</span>
          <p className="metric-value tone-warning">{pendingRequests.length}</p>
        </article>
        <article className="metric-card" onClick={() => setActiveTab('confirmed')} style={{ cursor: 'pointer', border: activeTab === 'confirmed' ? '2px solid #3182ce' : undefined }}>
          <span>Vacaciones Confirmadas</span>
          <p className="metric-value tone-success">{vacations.length}</p>
        </article>
      </section>

      {feedback ? <div className={`status-pill ${feedback.tone === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '1rem' }}>{feedback.message}</div> : null}

      {decision ? (
        <section className="table-card resource-shell-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-head-row">
            <div>
              <strong>
                {decision.type === 'approve' ? 'Aprobar solicitud' : decision.type === 'reject' ? 'Rechazar solicitud' : 'Eliminar vacaciones confirmadas'}
              </strong>
              <p className="table-note">Confirma la acción antes de continuar.</p>
            </div>
            <button className="secondary-button" onClick={() => { setDecision(null); setDecisionReason('') }} type="button">Cancelar</button>
          </div>
          {decision.type !== 'delete' ? (
            <div className="input-group" style={{ paddingTop: '1rem' }}>
              <label>{decision.type === 'reject' ? 'Motivo del rechazo' : 'Comentario interno (opcional)'}</label>
              <textarea value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} />
            </div>
          ) : (
            <p className="table-note" style={{ paddingTop: '1rem' }}>La vacación se eliminará del listado de confirmadas.</p>
          )}
          <div className="inline-actions" style={{ paddingTop: '1rem' }}>
            <button className="primary-button" onClick={handleDecisionSubmit} type="button" disabled={approveMutation.isPending || rejectMutation.isPending || deleteVacationMutation.isPending}>
              Confirmar acción
            </button>
          </div>
        </section>
      ) : null}

      {isFormVisible && (
        <section className="table-card resource-shell-card" style={{ marginBottom: '2rem' }}>
          <div className="section-head-row">
            <div>
              <strong>Nueva Solicitud</strong>
              <p className="table-note">Pide vacaciones o asuntos propios.</p>
            </div>
            <button className="secondary-button" onClick={() => setIsFormVisible(false)} type="button">
              Cancelar
            </button>
          </div>
          <form onSubmit={handleSubmitRequest} style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Tipo *</label>
                <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as typeof formData.type})}>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="asuntos_propios">Asuntos Propios</option>
                </select>
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Fecha Inicio *</label>
                <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Fecha Fin *</label>
                <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label>Motivo (opcional)</label>
              <textarea 
                value={formData.reason} 
                onChange={e => setFormData({...formData, reason: e.target.value})} 
                rows={2} 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <button className="primary-button" disabled={createMutation.isPending} type="submit">
              Enviar Solicitud
            </button>
          </form>
        </section>
      )}

      {activeTab === 'requests' && (
        <section className="table-card resource-shell-card">
          <div className="section-head-row">
            <div>
              <strong>Solicitudes de Empleados</strong>
              <p className="table-note">Peticiones de vacaciones o asuntos propios pendientes de revisión.</p>
            </div>
            {(user?.role === 'employee' || user?.role === 'coordinator') && !isFormVisible && (
              <button className="primary-button" onClick={() => setIsFormVisible(true)} type="button">
                + Nueva Solicitud
              </button>
            )}
          </div>

          {requestsQuery.isLoading ? <p className="empty-text">Cargando solicitudes...</p> : null}
          
          {pendingRequests.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #edf2f7', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Empleado</th>
                  <th style={{ padding: '1rem' }}>Tipo</th>
                  <th style={{ padding: '1rem' }}>Fechas</th>
                  <th style={{ padding: '1rem' }}>Días</th>
                  <th style={{ padding: '1rem' }}>Motivo</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '1rem' }}><strong>{req.employee_name}</strong></td>
                    <td style={{ padding: '1rem' }}>
                      <span className="status-pill">{req.type === 'asuntos_propios' ? 'Asuntos Propios' : 'Vacaciones'}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>{req.start_date} al {req.end_date}</td>
                    <td style={{ padding: '1rem' }}>{req.days_count}</td>
                    <td style={{ padding: '1rem' }}>{req.reason || '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {user?.role === 'admin' && (
                        <>
                          <button 
                            className="primary-button" 
                            onClick={() => handleApprove(req.id!)}
                            disabled={approveMutation.isPending}
                            type="button"
                            style={{ padding: '0.4rem 0.8rem', minHeight: 'auto' }}
                          >
                            Aprobar
                          </button>
                          <button 
                            className="secondary-button" 
                            onClick={() => handleReject(req.id!)}
                            disabled={rejectMutation.isPending}
                            type="button"
                            style={{ padding: '0.4rem 0.8rem', minHeight: 'auto', color: '#e53e3e', borderColor: '#fc8181' }}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {user?.role !== 'admin' && (
                         <span className="status-pill warning">Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !requestsQuery.isLoading && <p className="empty-text">No hay solicitudes pendientes.</p>
          )}

          {requests.filter(r => r.status !== 'pendiente').length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <strong style={{ padding: '0 1rem' }}>Historial Reciente</strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', opacity: 0.8 }}>
                <tbody>
                  {requests.filter(r => r.status !== 'pendiente').slice(0, 5).map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '0.5rem 1rem' }}>{req.employee_name}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{req.start_date} al {req.end_date}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <span className={`status-pill ${req.status === 'aprobada' ? 'success' : 'danger'}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'confirmed' && (
        <section className="table-card resource-shell-card">
          <div className="section-head-row">
            <div>
              <strong>Vacaciones Confirmadas</strong>
              <p className="table-note">Calendario de vacaciones y ausencias ya aprobadas.</p>
            </div>
          </div>

          {vacationsQuery.isLoading ? <p className="empty-text">Cargando vacaciones...</p> : null}
          
          {vacations.length > 0 ? (
            <div className="legacy-list-grid">
              {vacations.map(vacation => (
                <article className="legacy-list-card" key={vacation.id}>
                  <div className="legacy-list-card-head">
                    <div>
                      <strong>{vacation.employee_name}</strong>
                      <span>{vacation.start_date} → {vacation.end_date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="status-pill success">{vacation.type}</span>
                      {user?.role === 'admin' && (
                        <button 
                          className="secondary-button" 
                          onClick={() => handleDeleteVacation(vacation.id!)}
                          type="button"
                          style={{ padding: '0.2rem 0.5rem', color: '#e53e3e', borderColor: '#fc8181', fontSize: '0.8rem' }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="legacy-detail-grid">
                    <div>
                      <span className="meta-label">Días</span>
                      <p className="meta-value">{vacation.total_days ?? 0}</p>
                    </div>
                    <div>
                      <span className="meta-label">Estado</span>
                      <p className="meta-value">{vacation.status}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            !vacationsQuery.isLoading && <p className="empty-text">No hay vacaciones confirmadas.</p>
          )}
        </section>
      )}
    </>
  )
}
