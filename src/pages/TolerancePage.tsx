import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { loadUsers, loadZones } from '../services/resourceService'

interface ZoneToleranceSettings {
  zone_id: number
  default_entry_tolerance: number
  default_exit_tolerance: number
  notify_coordinator: boolean
  notify_after_minutes: number
  zone_name: string
}

interface EmployeeToleranceSchedule {
  day_of_week: number
  entry_tolerance_minutes: number
  exit_tolerance_minutes: number
  zone_default_entry?: number | null
  zone_default_exit?: number | null
  is_working_day?: boolean
  start_time?: string | null
  end_time?: string | null
}

interface TolerancePreset {
  name: string
  description: string
  entryTolerance: number | null
  exitTolerance: number | null
}

export function TolerancePage() {
  const queryClient = useQueryClient()
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('')
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null)
  const [employeeDrafts, setEmployeeDrafts] = useState<Record<number, { entryTolerance: number; exitTolerance: number }>>({})
  const [bulkForm, setBulkForm] = useState({ entryTolerance: 15, exitTolerance: 15 })

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: loadZones,
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: loadUsers,
  })

  const zones = zonesQuery.data ?? []
  const employees = (usersQuery.data ?? []).filter((candidate) => candidate.role === 'employee')

  const settingsQuery = useQuery({
    queryKey: ['tolerance_zone', selectedZoneId],
    queryFn: async () => {
      if (selectedZoneId === '') return null
      const result = await withAccessRefresh(() => apiClient.GET('/tolerance/zone', {
        params: { query: { zoneId: selectedZoneId } }
      }))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar tolerancias'))
      const data = result.data as unknown as { settings?: ZoneToleranceSettings }
      
      const settings = data.settings ?? null
      if (settings) {
        setFormData({
          defaultEntryTolerance: settings.default_entry_tolerance,
          defaultExitTolerance: settings.default_exit_tolerance,
          notifyCoordinator: Boolean(settings.notify_coordinator),
          notifyAfterMinutes: settings.notify_after_minutes,
        })
      }
      return settings
    },
    enabled: selectedZoneId !== '',
  })

  const settings = settingsQuery.data

  const presetsQuery = useQuery({
    queryKey: ['tolerance_presets'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/tolerance/presets'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar los presets'))
      const data = result.data as unknown as { presets?: TolerancePreset[] }
      return data.presets ?? []
    },
  })

  const employeeToleranceQuery = useQuery({
    queryKey: ['tolerance_employee', selectedEmployeeId],
    queryFn: async () => {
      if (selectedEmployeeId === '') return []
      const result = await withAccessRefresh(() => apiClient.GET('/tolerance/employee/{employeeId}', {
        params: { path: { employeeId: Number(selectedEmployeeId) } },
      }))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar las tolerancias del empleado'))
      const data = result.data as unknown as { schedules?: EmployeeToleranceSchedule[] }
      return data.schedules ?? []
    },
    enabled: selectedEmployeeId !== '',
  })

  const [formData, setFormData] = useState({
    defaultEntryTolerance: 15,
    defaultExitTolerance: 15,
    notifyCoordinator: true,
    notifyAfterMinutes: 0,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (selectedZoneId === '') return
      const result = await withAccessRefresh(() =>
        apiClient.PUT('/tolerance/zone', {
          body: {
            zoneId: selectedZoneId,
            defaultEntryTolerance: data.defaultEntryTolerance,
            defaultExitTolerance: data.defaultExitTolerance,
            notifyCoordinator: data.notifyCoordinator,
            notifyAfterMinutes: data.notifyAfterMinutes,
          },
        })
      )
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al actualizar tolerancias'))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tolerance_zone', selectedZoneId] })
      setNotice({ tone: 'success', message: 'Ajustes de zona guardados correctamente.' })
    },
    onError: (error: Error) => setNotice({ tone: 'danger', message: error.message }),
  })

  const updateEmployeeDayMutation = useMutation({
    mutationFn: async ({ dayOfWeek, entryTolerance, exitTolerance }: { dayOfWeek: number; entryTolerance: number; exitTolerance: number }) => {
      if (selectedEmployeeId === '') return
      const result = await withAccessRefresh(() => apiClient.PUT('/tolerance/employee/{employeeId}', {
        params: { path: { employeeId: Number(selectedEmployeeId) } },
        body: { dayOfWeek, entryTolerance, exitTolerance },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo guardar la tolerancia del día'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tolerance_employee', selectedEmployeeId] })
      setNotice({ tone: 'success', message: 'Tolerancia del día actualizada.' })
    },
    onError: (error: Error) => setNotice({ tone: 'danger', message: error.message }),
  })

  const updateEmployeeAllMutation = useMutation({
    mutationFn: async () => {
      if (selectedEmployeeId === '') return
      const result = await withAccessRefresh(() => apiClient.PUT('/tolerance/employee/{employeeId}/all', {
        params: { path: { employeeId: Number(selectedEmployeeId) } },
        body: bulkForm,
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo aplicar la tolerancia al empleado'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tolerance_employee', selectedEmployeeId] })
      setNotice({ tone: 'success', message: 'Tolerancia aplicada a todos los días del empleado.' })
    },
    onError: (error: Error) => setNotice({ tone: 'danger', message: error.message }),
  })

  const employeeSchedules = employeeToleranceQuery.data ?? []

  const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  const handlePreset = (preset: TolerancePreset) => {
    if (preset.entryTolerance === null || preset.exitTolerance === null) {
      return
    }
    setBulkForm({ entryTolerance: preset.entryTolerance, exitTolerance: preset.exitTolerance })
  }

  const updateDraft = (dayOfWeek: number, field: 'entryTolerance' | 'exitTolerance', value: number) => {
    setEmployeeDrafts((current) => ({
      ...current,
      [dayOfWeek]: {
        entryTolerance: current[dayOfWeek]?.entryTolerance ?? employeeSchedules.find((schedule) => schedule.day_of_week === dayOfWeek)?.entry_tolerance_minutes ?? 0,
        exitTolerance: current[dayOfWeek]?.exitTolerance ?? employeeSchedules.find((schedule) => schedule.day_of_week === dayOfWeek)?.exit_tolerance_minutes ?? 0,
        [field]: value,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  return (
    <>
      <PageHeader
        eyebrow="Tolerancias"
        subtitle="Configuración de los márgenes de tiempo permitidos al fichar."
        title="Tolerancias de Fichaje"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Zonas disponibles</span>
          <p className="metric-value">{zones.length}</p>
        </article>
        <article className="metric-card">
          <span>Empleados</span>
          <p className="metric-value">{employees.length}</p>
        </article>
      </section>

      {notice ? <div className={`status-pill ${notice.tone === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '1rem' }}>{notice.message}</div> : null}

      <section className="table-card resource-shell-card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div className="input-group" style={{ maxWidth: '400px', marginBottom: 0 }}>
          <label>Selecciona una zona para configurar</label>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">-- Seleccionar Zona --</option>
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>
      </section>

      {selectedZoneId !== '' && (
        <section className="table-card resource-shell-card">
          <div className="section-head-row">
            <div>
              <strong>Reglas de Tolerancia para la Zona</strong>
              <p className="table-note">Gestión de los ajustes de tolerancia para {settings?.zone_name || 'la zona seleccionada'}.</p>
            </div>
          </div>

          {settingsQuery.isLoading ? <p className="empty-text">Cargando configuración...</p> : null}
          {settingsQuery.isError ? (
            <div className="error-banner">{settingsQuery.error.message}</div>
          ) : null}

          {settings && (
            <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div className="input-group" style={{ flex: '1 1 200px' }}>
                  <label>Tolerancia Entrada (minutos) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.defaultEntryTolerance}
                    onChange={(e) => setFormData({ ...formData, defaultEntryTolerance: Number(e.target.value) })}
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    Margen permitido antes de marcar retraso en la entrada.
                  </small>
                </div>
                <div className="input-group" style={{ flex: '1 1 200px' }}>
                  <label>Tolerancia Salida (minutos) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.defaultExitTolerance}
                    onChange={(e) => setFormData({ ...formData, defaultExitTolerance: Number(e.target.value) })}
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    Margen permitido para salir antes sin penalización.
                  </small>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div className="input-group" style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.notifyCoordinator}
                      onChange={(e) => setFormData({ ...formData, notifyCoordinator: e.target.checked })}
                    />
                    Notificar a Coordinador
                  </label>
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    Avisar si se supera la tolerancia.
                  </small>
                </div>
                <div className="input-group" style={{ flex: '1 1 200px' }}>
                  <label>Notificar tras (minutos)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!formData.notifyCoordinator}
                    value={formData.notifyAfterMinutes}
                    onChange={(e) => setFormData({ ...formData, notifyAfterMinutes: Number(e.target.value) })}
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    Tiempo extra tras la tolerancia para enviar la notificación.
                  </small>
                </div>
              </div>

              <div className="inline-actions" style={{ marginTop: '2rem' }}>
                <button
                  className="primary-button"
                  disabled={updateMutation.isPending}
                  type="submit"
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar Ajustes'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <section className="table-card resource-shell-card" style={{ marginTop: '2rem' }}>
        <div className="section-head-row">
          <div>
            <strong>Tolerancias por empleado</strong>
            <p className="table-note">Ajusta tolerancias por día o aplica presets masivos a un empleado concreto.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem' }}>
          <div className="input-group" style={{ flex: '1 1 280px' }}>
            <label>Empleado</label>
            <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">-- Seleccionar empleado --</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ flex: '0 0 180px' }}>
            <label>Entrada global</label>
            <input type="number" min="0" value={bulkForm.entryTolerance} onChange={(e) => setBulkForm({ ...bulkForm, entryTolerance: Number(e.target.value) })} />
          </div>
          <div className="input-group" style={{ flex: '0 0 180px' }}>
            <label>Salida global</label>
            <input type="number" min="0" value={bulkForm.exitTolerance} onChange={(e) => setBulkForm({ ...bulkForm, exitTolerance: Number(e.target.value) })} />
          </div>
          <button className="primary-button" disabled={selectedEmployeeId === '' || updateEmployeeAllMutation.isPending} onClick={() => updateEmployeeAllMutation.mutate()} type="button">
            Aplicar a todos los días
          </button>
        </div>

        <div className="inline-actions" style={{ paddingTop: '1rem', flexWrap: 'wrap' }}>
          {(presetsQuery.data ?? []).map((preset) => (
            <button key={preset.name} className="secondary-button" disabled={preset.entryTolerance === null || preset.exitTolerance === null} onClick={() => handlePreset(preset)} type="button">
              {preset.name}
            </button>
          ))}
        </div>

        {selectedEmployeeId !== '' && employeeSchedules.length > 0 ? (
          <div className="legacy-list-grid" style={{ marginTop: '1.5rem' }}>
            {employeeSchedules.map((schedule) => {
              const draft = employeeDrafts[schedule.day_of_week] ?? {
                entryTolerance: schedule.entry_tolerance_minutes,
                exitTolerance: schedule.exit_tolerance_minutes,
              }
              return (
                <article className="legacy-list-card" key={schedule.day_of_week}>
                  <div className="legacy-list-card-head">
                    <div>
                      <strong>{dayLabels[schedule.day_of_week] ?? `Día ${schedule.day_of_week}`}</strong>
                      <span>{schedule.start_time && schedule.end_time ? `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}` : 'Sin jornada'}</span>
                    </div>
                    <span className="status-pill">Zona {schedule.zone_default_entry ?? 15}/{schedule.zone_default_exit ?? 15}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="input-group" style={{ flex: '1 1 150px' }}>
                      <label>Entrada</label>
                      <input type="number" min="0" value={draft.entryTolerance} onChange={(e) => updateDraft(schedule.day_of_week, 'entryTolerance', Number(e.target.value))} />
                    </div>
                    <div className="input-group" style={{ flex: '1 1 150px' }}>
                      <label>Salida</label>
                      <input type="number" min="0" value={draft.exitTolerance} onChange={(e) => updateDraft(schedule.day_of_week, 'exitTolerance', Number(e.target.value))} />
                    </div>
                    <button className="secondary-button" disabled={updateEmployeeDayMutation.isPending} onClick={() => updateEmployeeDayMutation.mutate({ dayOfWeek: schedule.day_of_week, entryTolerance: draft.entryTolerance, exitTolerance: draft.exitTolerance })} type="button">
                      Guardar día
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : selectedEmployeeId !== '' && !employeeToleranceQuery.isLoading ? (
          <p className="empty-text" style={{ marginTop: '1rem' }}>Este empleado no tiene horarios configurados para ajustar tolerancias.</p>
        ) : null}
      </section>
    </>
  )
}
