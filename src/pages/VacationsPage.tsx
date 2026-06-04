import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import {
  loadVacationRequests,
  approveVacationRequest,
  rejectVacationRequest,
  loadVacations,
  deleteVacation,
} from '../services/resourceService'

export function VacationsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'requests' | 'confirmed'>('requests')

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

  const pendingRequests = requests.filter(r => r.status === 'pendiente')

  const approveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => approveVacationRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacationRequests'] })
      queryClient.invalidateQueries({ queryKey: ['vacations'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectVacationRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacationRequests'] })
    },
  })

  const deleteVacationMutation = useMutation({
    mutationFn: deleteVacation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] })
    },
  })

  const handleApprove = (id: number) => {
    if (window.confirm('¿Aprobar esta solicitud?')) {
      approveMutation.mutate({ id, reason: '' })
    }
  }

  const handleReject = (id: number) => {
    const reason = window.prompt('Motivo del rechazo (opcional):', '')
    if (reason !== null) {
      rejectMutation.mutate({ id, reason })
    }
  }

  const handleDeleteVacation = (id: number) => {
    if (window.confirm('¿Eliminar esta vacación confirmada?')) {
      deleteVacationMutation.mutate(id)
    }
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

      {activeTab === 'requests' && (
        <section className="table-card resource-shell-card">
          <div className="section-head-row">
            <div>
              <strong>Solicitudes de Empleados</strong>
              <p className="table-note">Peticiones de vacaciones o asuntos propios pendientes de revisión.</p>
            </div>
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
                      <button 
                        className="primary-button" 
                        onClick={() => handleApprove(req.id!)}
                        disabled={approveMutation.isPending}
                        style={{ padding: '0.4rem 0.8rem', minHeight: 'auto' }}
                      >
                        Aprobar
                      </button>
                      <button 
                        className="secondary-button" 
                        onClick={() => handleReject(req.id!)}
                        disabled={rejectMutation.isPending}
                        style={{ padding: '0.4rem 0.8rem', minHeight: 'auto', color: '#e53e3e', borderColor: '#fc8181' }}
                      >
                        Rechazar
                      </button>
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
                      <button 
                        className="secondary-button" 
                        onClick={() => handleDeleteVacation(vacation.id!)}
                        style={{ padding: '0.2rem 0.5rem', color: '#e53e3e', borderColor: '#fc8181', fontSize: '0.8rem' }}
                      >
                        Eliminar
                      </button>
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