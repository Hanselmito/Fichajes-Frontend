import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { loadZones } from '../services/resourceService'

interface CalendarItem {
  id: number
  name: string
  description?: string | null
  region_code?: string | null
  created_by_name?: string | null
  holiday_count?: number
  regional_count?: number
  local_count?: number
  national_count?: number
}

interface CalendarHolidayItem {
  id: number
  name: string
  date: string
  type: string
  recurring?: boolean
}

interface ZoneHolidayItem {
  id: number
  zone_id?: number | null
  name: string
  date: string
  type: 'national' | 'regional' | 'local'
  recurring?: boolean
  created_by_name?: string | null
}

export function CalendarsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'zone' | 'personal'>('zone')
  const [editingCalendar, setEditingCalendar] = useState<CalendarItem | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null)
  const [zoneHolidayForm, setZoneHolidayForm] = useState({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'local' as 'local' | 'regional' | 'national',
    recurring: true,
  })
  const [holidayForm, setHolidayForm] = useState<{
    name: string
    date: string
    type: 'local' | 'regional' | 'national'
    recurring: boolean
  }>({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'local',
    recurring: false,
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region_code: 'ES-AN',
  })

  const calendarsQuery = useQuery({
    queryKey: ['calendars'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/calendars'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar calendarios'))
      const data = result.data as unknown as { calendars?: CalendarItem[] } | CalendarItem[]
      return (Array.isArray(data) ? data : data.calendars) ?? []
    },
  })

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: loadZones,
  })

  const zoneHolidaysQuery = useQuery({
    queryKey: ['zone_holidays', selectedZoneId, selectedYear],
    queryFn: async (): Promise<ZoneHolidayItem[]> => {
      const result = await withAccessRefresh(() => apiClient.GET('/zone-holidays', {
        params: {
          query: {
            zoneId: selectedZoneId === '' ? undefined : Number(selectedZoneId),
            year: selectedYear,
          },
        },
      }))
      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Error al cargar los festivos de zona'))
      }
      const data = result.data as unknown as { holidays?: ZoneHolidayItem[] }
      return data.holidays ?? []
    },
    enabled: activeTab === 'zone',
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const result = await withAccessRefresh(() => apiClient.POST('/calendars', {
        body: data,
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo crear el calendario'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
      setFeedback({ tone: 'success', message: 'Calendario creado correctamente.' })
      handleCloseForm()
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ calendarId, data }: { calendarId: number; data: typeof formData }) => {
      const result = await withAccessRefresh(() => apiClient.PUT('/calendars/{calendarId}', {
        params: { path: { calendarId } },
        body: data,
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo actualizar el calendario'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
      setFeedback({ tone: 'success', message: 'Calendario actualizado correctamente.' })
      handleCloseForm()
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (calendarId: number) => {
      const result = await withAccessRefresh(() => apiClient.DELETE('/calendars/{calendarId}', {
        params: { path: { calendarId } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo eliminar el calendario'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
      setFeedback({ tone: 'success', message: 'Calendario eliminado correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const holidaysQuery = useQuery({
    queryKey: ['calendar_holidays', selectedCalendarId],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/calendars/{calendarId}/holidays', {
        params: { path: { calendarId: Number(selectedCalendarId) } },
      }))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar los festivos'))
      const data = result.data as unknown as { holidays?: CalendarHolidayItem[] } | CalendarHolidayItem[]
      return (Array.isArray(data) ? data : data.holidays) ?? []
    },
    enabled: selectedCalendarId !== null,
  })

  const createHolidayMutation = useMutation({
    mutationFn: async () => {
      if (selectedCalendarId === null) return
      const result = await withAccessRefresh(() => apiClient.POST('/calendars/{calendarId}/holidays', {
        params: { path: { calendarId: selectedCalendarId } },
        body: holidayForm,
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo crear el festivo'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_holidays', selectedCalendarId] })
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
      setHolidayForm({ name: '', date: new Date().toISOString().slice(0, 10), type: 'local', recurring: false })
      setFeedback({ tone: 'success', message: 'Festivo del calendario añadido correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const deleteHolidayMutation = useMutation({
    mutationFn: async (holidayId: number) => {
      if (selectedCalendarId === null) return
      const result = await withAccessRefresh(() => apiClient.DELETE('/calendars/{calendarId}/holidays/{holidayId}', {
        params: { path: { calendarId: selectedCalendarId, holidayId } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo eliminar el festivo'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_holidays', selectedCalendarId] })
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
      setFeedback({ tone: 'success', message: 'Festivo del calendario eliminado correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const createZoneHolidayMutation = useMutation({
    mutationFn: async () => {
      const result = await withAccessRefresh(() => apiClient.POST('/zone-holidays', {
        body: {
          name: zoneHolidayForm.name,
          date: zoneHolidayForm.date,
          type: zoneHolidayForm.type,
          recurring: zoneHolidayForm.recurring,
          zoneId: selectedZoneId === '' ? null : Number(selectedZoneId),
        },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo crear el festivo de zona'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zone_holidays', selectedZoneId, selectedYear] })
      setZoneHolidayForm({
        name: '',
        date: new Date().toISOString().slice(0, 10),
        type: 'local',
        recurring: true,
      })
      setFeedback({ tone: 'success', message: 'Festivo de zona creado correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const importNationalMutation = useMutation({
    mutationFn: async () => {
      const result = await withAccessRefresh(() => apiClient.POST('/zone-holidays', {
        body: {
          importNager: true,
          year: selectedYear,
        },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudieron importar los festivos nacionales'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zone_holidays', selectedZoneId, selectedYear] })
      setFeedback({ tone: 'success', message: 'Festivos nacionales importados correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const deleteZoneHolidayMutation = useMutation({
    mutationFn: async (zoneHolidayId: number) => {
      const result = await withAccessRefresh(() => apiClient.DELETE('/zone-holidays/{zoneHolidayId}', {
        params: { path: { zoneHolidayId } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo eliminar el festivo de zona'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zone_holidays', selectedZoneId, selectedYear] })
      setFeedback({ tone: 'success', message: 'Festivo de zona eliminado correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const calendars = calendarsQuery.data ?? []
  const holidays = holidaysQuery.data ?? []
  const zones = zonesQuery.data ?? []
  const zoneHolidays = zoneHolidaysQuery.data ?? []
  const nationalCount = zoneHolidays.filter((holiday) => holiday.type === 'national').length
  const regionalCount = zoneHolidays.filter((holiday) => holiday.type === 'regional').length
  const localCount = zoneHolidays.filter((holiday) => holiday.type === 'local').length

  const handleOpenForm = (calendar?: CalendarItem) => {
    if (calendar) {
      setEditingCalendar(calendar)
      setFormData({
        name: calendar.name ?? '',
        description: calendar.description ?? '',
        region_code: calendar.region_code ?? 'ES-AN',
      })
    } else {
      setEditingCalendar(null)
      setFormData({
        name: '',
        description: '',
        region_code: 'ES-AN',
      })
    }

    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setEditingCalendar(null)
    setIsFormVisible(false)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (editingCalendar?.id) {
      updateMutation.mutate({ calendarId: editingCalendar.id, data: formData })
      return
    }

    createMutation.mutate(formData)
  }

  const handleDelete = (calendar: CalendarItem) => {
    if (!calendar.id) {
      return
    }

    if (window.confirm(`¿Eliminar el calendario ${calendar.name}?`)) {
      deleteMutation.mutate(calendar.id)
    }
  }

  return (
    <div className="card festivos-card-shell">
      <h2>{activeTab === 'zone' ? '🗓️ Gestión de Festivos' : '📋 Calendarios Personales'}</h2>

      {feedback ? <div className={`status-pill ${feedback.tone === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '1rem' }}>{feedback.message}</div> : null}

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`subtab-btn ${activeTab === 'zone' ? 'active' : ''}`} onClick={() => setActiveTab('zone')} type="button">🧾 Festivos por zona</button>
        <button className={`subtab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')} type="button">📋 Calendarios personales</button>
      </div>

      {activeTab === 'zone' ? (
        <>
          <div className="festivos-toolbar">
            <div className="festivos-filter-row">
              <div className="festivos-field">
                <label>Zona</label>
                <select value={selectedZoneId} onChange={(event) => setSelectedZoneId(event.target.value === '' ? '' : Number(event.target.value))}>
                  <option value="">Todas las zonas</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div className="festivos-field festivos-field-year">
                <label>Año</label>
                <input className="festivos-year-input" type="number" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} />
              </div>
            </div>
            <div className="festivos-actions">
              <button className="btn btn-primary" disabled={importNationalMutation.isPending} onClick={() => importNationalMutation.mutate()} type="button">🌐 Importar Festivos Nacionales {selectedYear}</button>
              <button className="btn btn-success" disabled={createZoneHolidayMutation.isPending || !zoneHolidayForm.name} onClick={() => createZoneHolidayMutation.mutate()} type="button">➕ Añadir Festivo Manual</button>
            </div>
          </div>

          <div className="festivos-stats-grid">
            <article className="festivos-stat-card festivos-stat-card-blue"><h3>{nationalCount}</h3><p>Nacionales</p></article>
            <article className="festivos-stat-card festivos-stat-card-purple"><h3>{regionalCount}</h3><p>Autonómicos</p></article>
            <article className="festivos-stat-card festivos-stat-card-orange"><h3>{localCount}</h3><p>Locales</p></article>
            <article className="festivos-stat-card festivos-stat-card-green"><h3>{zoneHolidays.length}</h3><p>Total</p></article>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); createZoneHolidayMutation.mutate() }} style={{ marginBottom: '1.5rem' }}>
            <div className="festivos-filter-row">
              <div className="festivos-field" style={{ flex: '1 1 240px' }}>
                <label>Nombre *</label>
                <input value={zoneHolidayForm.name} onChange={(event) => setZoneHolidayForm({ ...zoneHolidayForm, name: event.target.value })} />
              </div>
              <div className="festivos-field" style={{ flex: '0 0 180px' }}>
                <label>Fecha *</label>
                <input type="date" value={zoneHolidayForm.date} onChange={(event) => setZoneHolidayForm({ ...zoneHolidayForm, date: event.target.value })} />
              </div>
              <div className="festivos-field" style={{ flex: '0 0 180px' }}>
                <label>Tipo</label>
                <select value={zoneHolidayForm.type} onChange={(event) => setZoneHolidayForm({ ...zoneHolidayForm, type: event.target.value as ZoneHolidayItem['type'] })}>
                  <option value="national">Nacional</option>
                  <option value="regional">Autonómico</option>
                  <option value="local">Local</option>
                </select>
              </div>
              <label className="calendar-toggle-label" style={{ alignSelf: 'center' }}>
                <input checked={zoneHolidayForm.recurring} onChange={(event) => setZoneHolidayForm({ ...zoneHolidayForm, recurring: event.target.checked })} type="checkbox" />
                Recurrente
              </label>
            </div>
          </form>

          {zoneHolidaysQuery.isLoading ? <p className="festivos-empty-state">Cargando festivos...</p> : null}
          {zoneHolidaysQuery.isError ? <div className="error-banner">{zoneHolidaysQuery.error.message}</div> : null}

          {zoneHolidays.length > 0 ? (
            <div className="festivos-list">
              {zoneHolidays.map((holiday) => (
                <article className="festivos-item" key={holiday.id}>
                  <div className="festivos-item-head">
                    <div>
                      <strong>{holiday.name}</strong>
                      <p>{new Date(holiday.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                    </div>
                    <span className={`status-pill ${holiday.type === 'national' ? 'festivos-badge-national' : holiday.type === 'regional' ? 'festivos-badge-regional' : 'festivos-badge-local'}`}>{holiday.type === 'national' ? 'Nacional' : holiday.type === 'regional' ? 'Autonómico' : 'Local'}</span>
                  </div>
                  <div className="festivos-item-grid">
                    <div><span>Ámbito</span><strong>{holiday.zone_id ? zones.find((zone) => Number(zone.id) === Number(holiday.zone_id))?.name ?? 'Zona específica' : 'Todas las zonas'}</strong></div>
                    <div><span>Recurrente</span><strong className={`festivos-recurrent ${holiday.recurring ? 'festivos-recurrent-yes' : 'festivos-recurrent-no'}`}>{holiday.recurring ? '✓ Sí' : 'No'}</strong></div>
                    <div><span>Creado por</span><strong>{holiday.created_by_name ?? 'Sistema'}</strong></div>
                  </div>
                  <div className="festivos-item-actions">
                    <button className="btn btn-danger" onClick={() => deleteZoneHolidayMutation.mutate(holiday.id)} type="button">🗑️</button>
                  </div>
                </article>
              ))}
            </div>
          ) : !zoneHolidaysQuery.isLoading ? <p className="festivos-empty-state">No hay festivos cargados para el filtro actual.</p> : null}
        </>
      ) : (
        <>
          <p style={{ marginBottom: '1rem', color: '#60718a' }}>Gestiona calendarios personales y sus festivos propios combinados con los nacionales.</p>

      {isFormVisible ? (
        <section className="table-card resource-shell-card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="section-head-row">
            <div>
              <strong>{editingCalendar ? 'Editar calendario' : 'Nuevo calendario'}</strong>
              <p className="table-note">Configura el calendario base y la comunidad autónoma asociada.</p>
            </div>
            <button className="secondary-button" onClick={handleCloseForm} type="button">
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ paddingTop: '1rem', display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '1 1 260px' }}>
                <label>Nombre *</label>
                <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '1 1 180px' }}>
                <label>Región</label>
                <input value={formData.region_code} onChange={(event) => setFormData({ ...formData, region_code: event.target.value.toUpperCase() })} />
              </div>
            </div>

            <div className="input-group">
              <label>Descripción</label>
              <textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
            </div>

            <div className="inline-actions">
              <button className="primary-button" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
                {editingCalendar ? 'Guardar cambios' : 'Crear calendario'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <strong>Calendarios Activos: </strong> {calendars.length}
      </div>

      <div className="section-head-row" style={{ marginTop: '2rem' }}>
        <div>
          <strong>Listado de Calendarios</strong>
          <p className="table-note">Calendarios base asignables a empleados o zonas.</p>
        </div>
        {!isFormVisible ? (
          <button className="primary-button" onClick={() => handleOpenForm()} type="button">
            + Nuevo calendario
          </button>
        ) : null}
      </div>

      {calendarsQuery.isLoading ? <p className="empty-text">Cargando calendarios...</p> : null}
      {calendarsQuery.isError ? (
        <div className="alert alert-error">{calendarsQuery.error.message}</div>
      ) : null}

      {calendars.length > 0 ? (
        <div className="festivos-list">
          {calendars.map((cal: CalendarItem) => (
            <article className="festivos-item" key={cal.id}>
              <div className="festivos-item-head">
                <div>
                  <strong>{cal.name || `Calendario #${cal.id}`}</strong>
                  <p>{cal.description || `${cal.region_code || 'Sin región'} · ${cal.created_by_name ?? 'Sin creador'}`}</p>
                </div>
                <span className="status-pill festivos-badge-national">{cal.region_code || '---'}</span>
              </div>
              <div className="festivos-item-grid">
                <div><span>Es nacionales</span><strong>{cal.national_count ?? 0}</strong></div>
                <div><span>🏛 Autonómicos</span><strong>{cal.regional_count ?? 0}</strong></div>
                <div><span>📍 Locales</span><strong>{cal.local_count ?? 0}</strong></div>
                <div><span>Creado por</span><strong>{cal.created_by_name ?? 'Administrador'}</strong></div>
              </div>
              <div className="festivos-item-actions">
                <button className="btn btn-primary" onClick={() => setSelectedCalendarId(cal.id)} type="button">🗓 Ver festivos</button>
                <button className="btn btn-secondary" onClick={() => handleOpenForm(cal)} type="button">Editar</button>
                <button className="btn btn-danger" onClick={() => handleDelete(cal)} type="button">🗑️</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !calendarsQuery.isLoading && <p className="empty-text">No hay calendarios definidos.</p>
      )}

      {selectedCalendarId !== null ? (
        <section className="table-card resource-shell-card" style={{ marginTop: '1.5rem' }}>
          <div className="section-head-row">
            <div>
              <strong>Festivos del calendario #{selectedCalendarId}</strong>
              <p className="table-note">Alta y eliminación de festivos vinculados al calendario seleccionado.</p>
            </div>
            <button className="secondary-button" onClick={() => setSelectedCalendarId(null)} type="button">
              Cerrar
            </button>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); createHolidayMutation.mutate() }} style={{ paddingTop: '1rem', display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '1 1 240px' }}>
                <label>Nombre *</label>
                <input required value={holidayForm.name} onChange={(event) => setHolidayForm({ ...holidayForm, name: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '0 0 180px' }}>
                <label>Fecha *</label>
                <input type="date" required value={holidayForm.date} onChange={(event) => setHolidayForm({ ...holidayForm, date: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '0 0 180px' }}>
                <label>Tipo</label>
                <select value={holidayForm.type} onChange={(event) => setHolidayForm({ ...holidayForm, type: event.target.value as 'local' | 'regional' | 'national' })}>
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="national">Nacional</option>
                </select>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={holidayForm.recurring} onChange={(event) => setHolidayForm({ ...holidayForm, recurring: event.target.checked })} style={{ width: 'auto', minHeight: 'auto' }} />
              Recurrente cada año
            </label>
            <div className="inline-actions">
              <button className="primary-button" disabled={createHolidayMutation.isPending} type="submit">
                Añadir festivo
              </button>
            </div>
          </form>

          {holidaysQuery.isLoading ? <p className="empty-text">Cargando festivos...</p> : null}
          {holidaysQuery.isError ? <div className="error-banner">{holidaysQuery.error.message}</div> : null}

          {holidays.length > 0 ? (
            <div className="legacy-list-grid" style={{ marginTop: '1rem' }}>
              {holidays.map((holiday) => (
                <article className="legacy-list-card" key={holiday.id}>
                  <div className="legacy-list-card-head">
                    <div>
                      <strong>{holiday.name}</strong>
                      <span>{new Date(holiday.date).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="status-pill">{holiday.type}</span>
                      <button className="secondary-button" onClick={() => deleteHolidayMutation.mutate(holiday.id)} type="button" style={{ color: '#b42318', borderColor: '#fecaca' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : selectedCalendarId !== null && !holidaysQuery.isLoading ? (
            <p className="empty-text" style={{ marginTop: '1rem' }}>Este calendario todavía no tiene festivos cargados.</p>
          ) : null}
        </section>
      ) : null}
        </>
      )}
    </div>
  )
}
