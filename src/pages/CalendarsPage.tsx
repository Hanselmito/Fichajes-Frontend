import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

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

export function CalendarsPage() {
  const queryClient = useQueryClient()
  const [editingCalendar, setEditingCalendar] = useState<CalendarItem | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
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
      handleCloseForm()
    },
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
      handleCloseForm()
    },
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
    },
  })

  const calendars = calendarsQuery.data ?? []

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
    <div className="card">
      <h2>📅 Calendarios y Festivos</h2>
      <p>Definición de calendarios laborales y días festivos.</p>

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
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Región</th>
                <th>Festivos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {calendars.map((cal: CalendarItem) => (
                <tr key={cal.id}>
                  <td>{cal.id}</td>
                  <td>{cal.name || `Calendario #${cal.id}`}</td>
                  <td>{cal.description || 'Sin descripción'}</td>
                  <td>{cal.region_code || '---'}</td>
                  <td>
                    {(cal.holiday_count ?? 0)} total
                    {' · '}
                    {(cal.regional_count ?? 0)} regionales
                    {' · '}
                    {(cal.local_count ?? 0)} locales
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="secondary-button" onClick={() => handleOpenForm(cal)} type="button">
                        Editar
                      </button>
                      <button className="secondary-button" onClick={() => handleDelete(cal)} type="button" style={{ color: '#b42318', borderColor: '#fecaca' }}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !calendarsQuery.isLoading && <p className="empty-text">No hay calendarios definidos.</p>
      )}
    </div>
  )
}
