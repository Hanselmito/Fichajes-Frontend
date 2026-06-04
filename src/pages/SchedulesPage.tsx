import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { loadUsers } from '../services/resourceService'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

type ScheduleItem = {
  day_of_week?: number;
  start_time?: string | null;
  end_time?: string | null;
};

type ToleranceItem = {
  day_of_week?: number;
  entry_tolerance_minutes?: number | null;
  exit_tolerance_minutes?: number | null;
};

export function SchedulesPage() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: loadUsers,
  })

  const users = usersQuery.data ?? []

  // Load employee schedule
  const scheduleQuery = useQuery({
    queryKey: ['schedule', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null
      const result = await withAccessRefresh(() => apiClient.GET('/schedules/{employeeId}', {
        params: { path: { employeeId: selectedUser } }
      }))
      if (result.error || !result.data || !('schedules' in result.data)) throw new Error(getErrorMessage(result.error, 'Error al cargar horario'))
      return result.data.schedules
    },
    enabled: !!selectedUser,
  })

  // Load employee tolerance
  const toleranceQuery = useQuery({
    queryKey: ['tolerance', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null
      const result = await withAccessRefresh(() => apiClient.GET('/tolerance/employee/{employeeId}', {
        params: { path: { employeeId: selectedUser } }
      }))
      if (result.error || !result.data || !('schedules' in result.data)) throw new Error(getErrorMessage(result.error, 'Error al cargar tolerancia'))
      return result.data.schedules
    },
    enabled: !!selectedUser,
  })

  // When a user is selected, we might want to populate a local state to edit their schedules and tolerances.
  // We will keep it simple and just show a list of users, and when you click, it opens a quick view.
  
  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        subtitle="Asignación de turnos base a los empleados y configuración de márgenes de tolerancia."
        title="Horarios y Tolerancia"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Empleados con horario</span>
          <p className="metric-value tone-success">-</p>
        </article>
      </section>

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Empleados</strong>
            <p className="table-note">Selecciona un empleado para ver o editar su horario y tolerancia.</p>
          </div>
        </div>

        {usersQuery.isLoading ? <p className="empty-text">Cargando...</p> : null}
        <div className="legacy-list-grid">
          {users.map((u) => (
            <article className="legacy-list-card" key={u.id} style={{ cursor: 'pointer', border: selectedUser === u.id ? '2px solid #3182ce' : undefined }} onClick={() => setSelectedUser(u.id)}>
              <div className="legacy-list-card-head">
                <div>
                  <strong>{u.name}</strong>
                  <span>{u.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedUser && (
        <section className="table-card resource-shell-card" style={{ marginTop: '2rem' }}>
          <div className="section-head-row">
            <div>
              <strong>Detalle de Horario y Tolerancia</strong>
              <p className="table-note">Valores actuales para el empleado seleccionado.</p>
            </div>
            <button className="secondary-button" onClick={() => setSelectedUser(null)}>Cerrar</button>
          </div>
          
          <div style={{ padding: '1rem', display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <strong>Horario ({scheduleQuery.isLoading ? 'Cargando...' : 'Cargado'})</strong>
              <ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
                {scheduleQuery.data?.map((s: ScheduleItem, idx: number) => (
                  <li key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid #edf2f7' }}>
                    Día {s.day_of_week}: {s.start_time} - {s.end_time}
                  </li>
                ))}
                {!scheduleQuery.data?.length && <li className="empty-text">Sin horario asignado.</li>}
              </ul>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#718096' }}>
                * La edición de horarios requiere de la interfaz avanzada de segmentos (employee-schedules).
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <strong>Tolerancia ({toleranceQuery.isLoading ? 'Cargando...' : 'Cargado'})</strong>
              <ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
                {toleranceQuery.data?.map((t: ToleranceItem, idx: number) => (
                  <li key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid #edf2f7' }}>
                    Día {t.day_of_week}: {t.entry_tolerance_minutes} min (Entrada), {t.exit_tolerance_minutes} min (Salida)
                  </li>
                ))}
                {!toleranceQuery.data?.length && <li className="empty-text">Sin tolerancia personalizada.</li>}
              </ul>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
