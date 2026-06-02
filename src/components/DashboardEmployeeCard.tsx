import type { DashboardEmployee } from '../types/dashboard'

type DashboardEmployeeCardProps = {
  employee: DashboardEmployee
}

export function DashboardEmployeeCard({ employee }: DashboardEmployeeCardProps) {
  return (
    <article className="employee-overview-card">
      <div className="employee-overview-head">
        <div>
          <strong>{employee.name}</strong>
          <span>{employee.role}</span>
        </div>
        <span className={`status-pill ${employee.status_display_tone}`}>
          {employee.status_display_label}
        </span>
      </div>

      <div className="employee-overview-grid">
        <div>
          <span className="meta-label">Cliente actual</span>
          <p className="meta-value">{employee.current_client_name ?? 'Sin visita en curso'}</p>
        </div>
        <div>
          <span className="meta-label">Siguiente visita</span>
          <p className="meta-value">
            {employee.next_assignment
              ? `${employee.next_assignment.client_name} · ${employee.next_assignment.start_time}`
              : 'Sin proxima asignacion'}
          </p>
        </div>
        <div>
          <span className="meta-label">Horas de la semana</span>
          <p className="meta-value">{employee.hours_worked_week}</p>
        </div>
        <div>
          <span className="meta-label">Zona</span>
          <p className="meta-value">{employee.zone_name ?? 'Sin zona'}</p>
        </div>
      </div>
    </article>
  )
}