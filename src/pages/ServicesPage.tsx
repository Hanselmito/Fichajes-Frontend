import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

interface ServiceItem {
  id: number
  name: string
  duration_minutes: number
  color: string
  active: boolean
}

export function ServicesPage() {
  const queryClient = useQueryClient()
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: 60,
    color: '#2196F3',
    active: true,
  })

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const result = await withAccessRefresh(() => apiClient.GET('/services'))
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al cargar servicios'))
      const data = result.data as unknown as { services?: ServiceItem[] } | ServiceItem[]
      return (Array.isArray(data) ? data : data.services) ?? []
    },
  })

  const services = servicesQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const result = await withAccessRefresh(() =>
        apiClient.POST('/services', {
          body: {
            name: data.name,
            duration_minutes: data.duration_minutes,
            color: data.color,
          },
        })
      )
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al crear servicio'))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const result = await withAccessRefresh(() =>
        apiClient.PUT('/services/{serviceId}', {
          params: { path: { serviceId: id } },
          body: {
            name: data.name,
            duration_minutes: data.duration_minutes,
            color: data.color,
            active: data.active,
          },
        })
      )
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al actualizar servicio'))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await withAccessRefresh(() =>
        apiClient.DELETE('/services/{serviceId}', {
          params: { path: { serviceId: id } },
        })
      )
      if (result.error) throw new Error(getErrorMessage(result.error, 'Error al eliminar servicio'))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })

  const handleOpenForm = (service?: ServiceItem) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        duration_minutes: service.duration_minutes,
        color: service.color,
        active: service.active,
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        duration_minutes: 60,
        color: '#2196F3',
        active: true,
      })
    }
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setEditingService(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingService?.id) {
      updateMutation.mutate({ id: editingService.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas desactivar este servicio?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Servicios"
        subtitle="Listado y asignación de servicios para los clientes de la aplicación."
        title="Gestión de Servicios"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Servicios Activos</span>
          <p className="metric-value">{services.filter(s => s.active).length}</p>
        </article>
      </section>

      {isFormVisible ? (
        <section className="table-card resource-shell-card" style={{ marginBottom: '2rem' }}>
          <div className="section-head-row">
            <div>
              <strong>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</strong>
              <p className="table-note">Configura el nombre y la duración del servicio.</p>
            </div>
            <button className="secondary-button" onClick={handleCloseForm} type="button">
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="input-group" style={{ flex: '1 1 300px' }}>
                <label>Nombre del servicio *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>Duración (minutos) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                />
              </div>
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ height: '38px', width: '100%', padding: '0 5px' }}
                />
              </div>
              {editingService && (
                <div className="input-group" style={{ flex: '1 1 100px', display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    Activo
                  </label>
                </div>
              )}
            </div>

            <div className="inline-actions" style={{ marginTop: '1rem' }}>
              <button
                className="primary-button"
                disabled={createMutation.isPending || updateMutation.isPending}
                type="submit"
              >
                {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Servicios Activos</strong>
            <p className="table-note">Gestión de la tabla services y su relación con clientes.</p>
          </div>
          {!isFormVisible && (
            <button className="primary-button" onClick={() => handleOpenForm()} type="button">
              + Nuevo Servicio
            </button>
          )}
        </div>

        {servicesQuery.isLoading ? <p className="empty-text">Cargando servicios...</p> : null}
        {servicesQuery.isError ? (
          <div className="error-banner">{servicesQuery.error.message}</div>
        ) : null}

        {services.length > 0 ? (
          <div className="legacy-list-grid">
            {services.map((service) => (
              <article className="legacy-list-card" key={service.id}>
                <div className="legacy-list-card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: service.color, borderRadius: '4px' }} />
                    <strong>{service.name}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`status-pill ${service.active ? 'success' : 'danger'}`}>
                      {service.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      className="secondary-button"
                      onClick={() => handleOpenForm(service)}
                      type="button"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Editar
                    </button>
                    {service.active && (
                      <button
                        className="secondary-button"
                        onClick={() => handleDelete(service.id)}
                        type="button"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#e53e3e', borderColor: '#fc8181' }}
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>

                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Duración</span>
                    <p className="meta-value">{service.duration_minutes} min</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !servicesQuery.isLoading && <p className="empty-text">No hay servicios configurados.</p>
        )}
      </section>
    </>
  )
}
