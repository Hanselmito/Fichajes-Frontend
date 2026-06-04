import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { loadReportsStats, loadUsers, loadWorkHoursBalance } from '../services/resourceService'
import { getApiBaseUrl } from '../api/config'
import { getStoredAccessToken } from '../auth/session'

export function ReportsPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))

  const statsQuery = useQuery({
    queryKey: ['reportStats'],
    queryFn: loadReportsStats,
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: loadUsers,
  })

  const balanceQuery = useQuery({
    queryKey: ['workHoursBalance', selectedUserId, selectedMonth],
    queryFn: () => loadWorkHoursBalance(Number(selectedUserId), selectedMonth),
    enabled: selectedUserId !== '' && selectedMonth !== '',
  })

  const stats = statsQuery.data
  const employees = usersQuery.data?.filter(u => Boolean(u.active)) ?? []
  const balance = balanceQuery.data

  const handleDownload = async (mode: string, extension: string) => {
    try {
      const token = getStoredAccessToken()
      const url = `${getApiBaseUrl().replace(/\/$/, '')}/reports/${mode}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Error al descargar el informe')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `fichajes_reporte.${extension}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (e) {
      alert('Hubo un problema descargando el reporte')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Informes"
        subtitle="Extracción de datos para nóminas, totales del sistema y desglose de horas trabajadas por empleado."
        title="Informes y Horas Trabajadas"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Fichajes totales</span>
          <p className="metric-value">{stats?.total_records ?? '-'}</p>
        </article>
        <article className="metric-card">
          <span>Empleados activos</span>
          <p className="metric-value tone-success">{stats?.active_employees ?? '-'}</p>
        </article>
        <article className="metric-card">
          <span>Pendientes confirmar</span>
          <p className="metric-value tone-warning">{stats?.pending_confirmation ?? '-'}</p>
        </article>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        <section className="table-card resource-shell-card">
          <div className="section-head-row">
            <div>
              <strong>Descarga Global</strong>
              <p className="table-note">Exporta todos los registros del sistema.</p>
            </div>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="primary-button" onClick={() => handleDownload('csv', 'csv')} type="button" style={{ width: '100%', justifyContent: 'center' }}>
              Descargar CSV (Excel)
            </button>
            <button className="secondary-button" onClick={() => handleDownload('text', 'txt')} type="button" style={{ width: '100%', justifyContent: 'center' }}>
              Descargar Informe TXT
            </button>
            <button className="secondary-button" onClick={() => handleDownload('json', 'json')} type="button" style={{ width: '100%', justifyContent: 'center' }}>
              Descargar Informe JSON
            </button>
          </div>
        </section>

        <section className="table-card resource-shell-card">
          <div className="section-head-row">
            <div>
              <strong>Balance de Horas por Empleado</strong>
              <p className="table-note">Selecciona un usuario para ver su cómputo y detalle de horas trabajadas.</p>
            </div>
          </div>
          
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Empleado</label>
              <select 
                value={selectedUserId} 
                onChange={(e) => setSelectedUserId(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Seleccione un empleado...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Mes</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                style={{ padding: '0.5rem' }}
              />
            </div>
          </div>

          {balanceQuery.isLoading && <p className="empty-text">Calculando balance de horas...</p>}
          {balanceQuery.isError && <div className="error-banner">No se pudo cargar el balance del usuario seleccionado.</div>}

          {balance && (
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', backgroundColor: '#f7fafc', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <span className="meta-label">Horas Totales</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{balance.total_hours_worked}h</p>
                </div>
                <div>
                  <span className="meta-label">Horas Esperadas</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#4a5568' }}>{balance.expected_hours}h</p>
                </div>
                <div>
                  <span className="meta-label">Balance</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: balance.balance >= 0 ? '#38a169' : '#e53e3e' }}>
                    {balance.balance > 0 ? '+' : ''}{balance.balance}h
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                <div><strong>Días trabajados:</strong> {balance.work_days}</div>
                <div><strong>Días de vacaciones:</strong> {balance.vacation_days}</div>
                <div><strong>Días festivos:</strong> {balance.holiday_days}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #edf2f7', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Fecha</th>
                    <th style={{ padding: '0.5rem' }}>Tipo</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Horas</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.days_detail.map((day) => (
                    <tr key={day.date} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '0.5rem' }}>{day.date}</td>
                      <td style={{ padding: '0.5rem' }}>
                        {day.type === 'work' && <span className="status-pill success">Trabajo</span>}
                        {day.type === 'vacation' && <span className="status-pill">Vacaciones</span>}
                        {day.type === 'holiday' && <span className="status-pill warning">Festivo</span>}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {day.hours ? `${day.hours}h` : '-'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: (day.balance ?? 0) < 0 ? '#e53e3e' : 'inherit' }}>
                        {day.balance ? `${day.balance > 0 ? '+' : ''}${day.balance}h` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!balance && !balanceQuery.isLoading && selectedUserId !== '' && (
            <p className="empty-text">No hay datos de balance para mostrar.</p>
          )}
        </section>
      </div>
    </>
  )
}
