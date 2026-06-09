import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { loadUsers } from '../services/resourceService'

interface BolsaAnotacion {
  id: number
  employee_id: number
  date: string
  text: string
  affects_hours: boolean
  hours_adjustment: string | number
  color?: string | null
  created_by_name?: string | null
}

export function BolsaAnotacionesPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'coordinator'
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('')
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [editingAnotacion, setEditingAnotacion] = useState<BolsaAnotacion | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    text: '',
    affects_hours: true,
    hours_adjustment: 0,
    color: '#9C27B0',
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: loadUsers,
    enabled: isManager,
  })

  const targetEmployeeId = isManager ? selectedEmployeeId : (user?.id ?? '')

  const bolsaQuery = useQuery({
    queryKey: ['bolsa_anotaciones', targetEmployeeId, selectedMonth],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/bolsa-anotaciones', {
        params: {
          query: {
            employeeId: Number(targetEmployeeId),
            month: selectedMonth,
          },
        },
      }))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar anotaciones'))
      const data = result.data as unknown as { anotaciones?: BolsaAnotacion[] } | BolsaAnotacion[]
      return (Array.isArray(data) ? data : data.anotaciones) ?? []
    },
    enabled: targetEmployeeId !== '',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await withAccessRefresh(() => apiClient.POST('/bolsa-anotaciones', {
        body: {
          employee_id: Number(targetEmployeeId),
          date: formData.date,
          text: formData.text,
          affects_hours: formData.affects_hours,
          hours_adjustment: formData.affects_hours ? formData.hours_adjustment : 0,
          color: formData.color,
        },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo crear la anotación'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bolsa_anotaciones'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (anotacionId: number) => {
      const result = await withAccessRefresh(() => apiClient.PUT('/bolsa-anotaciones/{anotacionId}', {
        params: { path: { anotacionId } },
        body: {
          text: formData.text,
          affects_hours: formData.affects_hours,
          hours_adjustment: formData.affects_hours ? formData.hours_adjustment : 0,
          color: formData.color,
        },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo actualizar la anotación'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bolsa_anotaciones'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (anotacionId: number) => {
      const result = await withAccessRefresh(() => apiClient.DELETE('/bolsa-anotaciones/{anotacionId}', {
        params: { path: { anotacionId } },
      }))
      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo eliminar la anotación'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bolsa_anotaciones'] })
    },
  })

  const anotaciones = bolsaQuery.data ?? []
  const assignableUsers = (usersQuery.data ?? []).filter((candidate) => candidate.role !== 'admin')

  const handleOpenForm = (anotacion?: BolsaAnotacion) => {
    if (anotacion) {
      setEditingAnotacion(anotacion)
      setFormData({
        date: anotacion.date,
        text: anotacion.text,
        affects_hours: anotacion.affects_hours,
        hours_adjustment: Number(anotacion.hours_adjustment),
        color: anotacion.color ?? '#9C27B0',
      })
    } else {
      setEditingAnotacion(null)
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        text: '',
        affects_hours: true,
        hours_adjustment: 0,
        color: '#9C27B0',
      })
    }
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setEditingAnotacion(null)
    setIsFormVisible(false)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (editingAnotacion?.id) {
      updateMutation.mutate(editingAnotacion.id)
      return
    }

    createMutation.mutate()
  }

  const handleDelete = (anotacion: BolsaAnotacion) => {
    if (window.confirm('¿Eliminar esta anotación de bolsa de horas?')) {
      deleteMutation.mutate(anotacion.id)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Control Horario"
        subtitle="Gestión de horas extras y compensaciones para los empleados."
        title="Bolsa de Horas"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Anotaciones Totales</span>
          <p className="metric-value">{anotaciones.length}</p>
        </article>
      </section>

      <section className="table-card resource-shell-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
          {isManager ? (
            <div className="input-group" style={{ flex: '1 1 260px' }}>
              <label>Empleado</label>
              <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value === '' ? '' : Number(event.target.value))}>
                <option value="">Selecciona un empleado</option>
                {assignableUsers.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="input-group" style={{ flex: '0 0 180px' }}>
            <label>Mes</label>
            <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
          </div>

          {isManager ? (
            <button className="primary-button" disabled={targetEmployeeId === ''} onClick={() => handleOpenForm()} type="button">
              + Nueva anotación
            </button>
          ) : null}
        </div>
      </section>

      {isManager && isFormVisible ? (
        <section className="table-card resource-shell-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-head-row">
            <div>
              <strong>{editingAnotacion ? 'Editar anotación' : 'Nueva anotación'}</strong>
              <p className="table-note">Ajusta horas extras, compensaciones o notas internas para el empleado seleccionado.</p>
            </div>
            <button className="secondary-button" onClick={handleCloseForm} type="button">Cancelar</button>
          </div>

          <form onSubmit={handleSubmit} style={{ paddingTop: '1rem', display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '0 0 180px' }}>
                <label>Fecha *</label>
                <input type="date" required value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} />
              </div>
              <div className="input-group" style={{ flex: '0 0 180px' }}>
                <label>Color</label>
                <input type="color" value={formData.color} onChange={(event) => setFormData({ ...formData, color: event.target.value })} style={{ minHeight: '48px', padding: '8px' }} />
              </div>
            </div>

            <div className="input-group">
              <label>Texto *</label>
              <textarea required value={formData.text} onChange={(event) => setFormData({ ...formData, text: event.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
              <div className="input-group" style={{ flex: '0 0 220px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={formData.affects_hours} onChange={(event) => setFormData({ ...formData, affects_hours: event.target.checked })} style={{ width: 'auto', minHeight: 'auto' }} />
                  Afecta al saldo de horas
                </label>
              </div>
              <div className="input-group" style={{ flex: '0 0 220px' }}>
                <label>Ajuste (horas)</label>
                <input type="number" step="0.25" value={formData.hours_adjustment} disabled={!formData.affects_hours} onChange={(event) => setFormData({ ...formData, hours_adjustment: Number(event.target.value) })} />
              </div>
            </div>

            <div className="inline-actions">
              <button className="primary-button" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
                {editingAnotacion ? 'Guardar cambios' : 'Crear anotación'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Listado de Anotaciones</strong>
            <p className="table-note">Horas añadidas o restadas a la bolsa del empleado.</p>
          </div>
        </div>

        {targetEmployeeId === '' ? <p className="empty-text">Selecciona un empleado para consultar su bolsa de horas.</p> : null}
        {bolsaQuery.isLoading ? <p className="empty-text">Cargando anotaciones...</p> : null}
        {bolsaQuery.isError ? (
          <div className="error-banner">{bolsaQuery.error.message}</div>
        ) : null}

        {targetEmployeeId !== '' && anotaciones.length > 0 ? (
          <div className="legacy-list-grid">
            {anotaciones.map((anotacion: BolsaAnotacion) => (
              <article className="legacy-list-card" key={anotacion.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{anotacion.text || `Anotación #${anotacion.id}`}</strong>
                    <span className={Number(anotacion.hours_adjustment) >= 0 ? 'tone-success' : 'tone-danger'}>
                      {Number(anotacion.hours_adjustment) >= 0 ? '+' : ''}{Number(anotacion.hours_adjustment).toFixed(2)} h
                    </span>
                  </div>
                  {isManager ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="secondary-button" onClick={() => handleOpenForm(anotacion)} type="button">Editar</button>
                      <button className="secondary-button" onClick={() => handleDelete(anotacion)} type="button" style={{ color: '#b42318', borderColor: '#fecaca' }}>Eliminar</button>
                    </div>
                  ) : null}
                </div>
                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Afecta horas</span>
                    <p className="meta-value">{anotacion.affects_hours ? 'Sí' : 'No'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Fecha</span>
                    <p className="meta-value">{anotacion.date ? new Date(anotacion.date).toLocaleDateString() : '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Creada por</span>
                    <p className="meta-value">{anotacion.created_by_name || 'Sistema'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !bolsaQuery.isLoading && targetEmployeeId !== '' ? <p className="empty-text">No hay anotaciones en la bolsa.</p> : null
        )}
      </section>
    </>
  )
}
