import type { DashboardEmployee } from '../types/dashboard'

type DashboardEmployeeCardProps = {
  employee: DashboardEmployee
}

export function DashboardEmployeeCard({ employee }: DashboardEmployeeCardProps) {
  let statusClass = ''
  let statusIcon = ''
  let statusText = ''

  if (employee.status === 'trabajando') {
    statusClass = 'dashboard-status-working'
    statusIcon = '🟢'
    statusText = 'Trabajando'
  } else if (employee.status === 'vacaciones') {
    statusClass = 'dashboard-status-vacation'
    statusIcon = '🏖️'
    statusText = employee.vacation_type === 'vacaciones' ? 'Vacaciones' : 'Asuntos Propios'
  } else {
    statusClass = 'dashboard-status-absent'
    statusIcon = '🔴'
    statusText = 'Ausente'
  }

  const progressToneClass = employee.percentage >= 100 ? 'is-progress-high' : employee.percentage >= 50 ? 'is-progress-medium' : 'is-progress-low'

  const formatShortHour = (dateStr?: string | null) => {
    if (!dateStr) return '--:--'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return '--:--'
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '--:--'
    }
  }

  const buildScheduleText = (s1?: string, e1?: string, s2?: string, e2?: string) => {
    const ranges: string[] = []
    if (s1 && e1) ranges.push(`${s1.slice(0, 5)} - ${e1.slice(0, 5)}`)
    if (s2 && e2) ranges.push(`${s2.slice(0, 5)} - ${e2.slice(0, 5)}`)
    return ranges.join(' | ')
  }

  return (
    <div className={`card dashboard-employee-card ${statusClass}`}>
      <div className="dashboard-employee-head">
        <div>
          <h3 className="dashboard-employee-name">{employee.name}</h3>
          <p className="dashboard-employee-zone">{employee.zone_name ?? 'Sin zona'}</p>
          
          {employee.schedule_start && employee.schedule_end ? (
            <p className={`dashboard-schedule-text ${employee.within_schedule ? 'is-schedule-inside' : 'is-schedule-outside'}`}>
              {employee.within_schedule ? '🕒' : '⏰'} {buildScheduleText(employee.schedule_start, employee.schedule_end, employee.schedule_start_2, employee.schedule_end_2)}{' '}
              <span className="dashboard-schedule-status">
                ({employee.within_schedule ? 'Dentro' : 'Fuera'})
              </span>
            </p>
          ) : null}
        </div>
        <div className="dashboard-status-wrap">
          <span className={`dashboard-status-badge ${statusClass}`}>
            {statusIcon} {statusText}
          </span>
        </div>
      </div>

      {employee.status !== 'vacaciones' && (
        <>
          <div className="dashboard-progress-block">
            <div className="dashboard-progress-head">
              <span className="dashboard-progress-label">
                Horas totales por semana: {employee.hours_worked_week}h / {employee.weekly_hours}h
              </span>
              <span className={`dashboard-progress-value ${progressToneClass}`}>
                {employee.percentage}%
              </span>
            </div>
            <div className="dashboard-progress-track">
              <div 
                className={`dashboard-progress-bar ${progressToneClass}`} 
                data-width={employee.percentage}
                style={{ width: `${employee.percentage}%` }}
              ></div>
            </div>
          </div>

          {employee.last_action_time && (
            <p className="dashboard-last-action">
              Última acción: {employee.last_action === 'entrada' ? 'Entrada' : 'Salida'} a las {formatShortHour(employee.last_action_time)}
            </p>
          )}
        </>
      )}
    </div>
  )
}
