import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import {
  createZone,
  deleteZone,
  loadZones,
  regenerateZoneQr,
  updateZone,
} from '../services/resourceService'
import type { ZoneItem } from '../types/resources'

export function ZonesPage() {
  const queryClient = useQueryClient()
  const [editingZone, setEditingZone] = useState<ZoneItem | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postalCode: '',
    city: '',
    province: '',
    regionCode: '',
  })

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: loadZones,
  })

  const zones = zonesQuery.data ?? []
  const totalZones = zones.length
  const zonesWithQr = zones.filter((z) => Boolean(z.qr_code)).length

  const createMutation = useMutation({
    mutationFn: createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateZone>[1] }) => updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
    },
  })

  const regenerateQrMutation = useMutation({
    mutationFn: (id: number) => regenerateZoneQr(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
    },
  })

  const handleOpenForm = (zone?: ZoneItem) => {
    if (zone) {
      setEditingZone(zone)
      setFormData({
        name: zone.name ?? '',
        address: zone.address ?? '',
        postalCode: zone.postal_code ?? '',
        city: zone.city ?? '',
        province: zone.province ?? '',
        regionCode: zone.region_code ?? '',
      })
    } else {
      setEditingZone(null)
      setFormData({
        name: '',
        address: '',
        postalCode: '',
        city: '',
        province: '',
        regionCode: '',
      })
    }
    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setEditingZone(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingZone?.id) {
      updateMutation.mutate({ id: editingZone.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta zona?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleRegenerateQr = (id: number) => {
    if (window.confirm('¿Regenerar QR? Esto invalidará el código actual.')) {
      regenerateQrMutation.mutate(id)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Zonas"
        subtitle="Administración de zonas de trabajo y generación de códigos QR para fichaje."
        title="Gestión de Zonas"
      />

      <section className="metric-grid module-metric-grid">
        <article className="metric-card">
          <span>Total zonas</span>
          <p className="metric-value">{totalZones}</p>
        </article>
        <article className="metric-card">
          <span>Con QR activo</span>
          <p className="metric-value tone-success">{zonesWithQr}</p>
        </article>
        <article className="metric-card">
          <span>Sin QR</span>
          <p className="metric-value tone-warning">{totalZones - zonesWithQr}</p>
        </article>
      </section>

      {isFormVisible ? (
        <section className="table-card resource-shell-card" style={{ marginBottom: '2rem' }}>
          <div className="section-head-row">
            <div>
              <strong>{editingZone ? 'Editar zona' : 'Nueva zona'}</strong>
              <p className="table-note">Completa los datos de la zona de trabajo.</p>
            </div>
            <button className="secondary-button" onClick={handleCloseForm} type="button">
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="input-group" style={{ flex: '1 1 300px' }}>
                <label>Nombre de zona *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="input-group" style={{ flex: '1 1 300px' }}>
                <label>Dirección</label>
                <input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>Código Postal</label>
                <input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Ciudad</label>
                <input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="input-group" style={{ flex: '1 1 200px' }}>
                <label>Provincia</label>
                <input
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                />
              </div>
              <div className="input-group" style={{ flex: '1 1 150px' }}>
                <label>Región</label>
                <input
                  value={formData.regionCode}
                  onChange={(e) => setFormData({ ...formData, regionCode: e.target.value })}
                />
              </div>
            </div>

            <div className="inline-actions" style={{ marginTop: '1rem' }}>
              <button
                className="primary-button"
                disabled={createMutation.isPending || updateMutation.isPending}
                type="submit"
              >
                {editingZone ? 'Guardar Cambios' : 'Crear Zona'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="table-card resource-shell-card">
        <div className="section-head-row">
          <div>
            <strong>Listado de zonas</strong>
            <p className="table-note">Zonas configuradas en el sistema para asignación y fichaje.</p>
          </div>
          {!isFormVisible && (
            <button className="primary-button" onClick={() => handleOpenForm()} type="button">
              + Nueva Zona
            </button>
          )}
        </div>

        {zonesQuery.isLoading ? <p className="empty-text">Cargando zonas...</p> : null}
        {zonesQuery.isError ? (
          <div className="error-banner">{zonesQuery.error.message}</div>
        ) : null}

        {zones.length > 0 ? (
          <div className="legacy-list-grid">
            {zones.map((zone) => (
              <article className="legacy-list-card" key={zone.id}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{zone.name}</strong>
                    <span>{zone.address ?? 'Sin dirección'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {zone.id && (
                      <button
                        className="secondary-button"
                        onClick={() => handleOpenForm(zone)}
                        type="button"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        Editar
                      </button>
                    )}
                    {zone.id && (
                      <button
                        className="secondary-button"
                        onClick={() => handleDelete(zone.id!)}
                        type="button"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#e53e3e', borderColor: '#fc8181' }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                <div className="legacy-detail-grid">
                  <div>
                    <span className="meta-label">Ciudad</span>
                    <p className="meta-value">{zone.city ?? '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Provincia</span>
                    <p className="meta-value">{zone.province ?? '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">Código Postal</span>
                    <p className="meta-value">{zone.postal_code ?? '---'}</p>
                  </div>
                  <div>
                    <span className="meta-label">QR Código</span>
                    <p className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {zone.qr_code ?? 'Sin QR'}
                      {zone.id && (
                        <button
                          className="secondary-button"
                          onClick={() => handleRegenerateQr(zone.id!)}
                          type="button"
                          style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}
                          title="Regenerar QR"
                        >
                          ↻
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !zonesQuery.isLoading && <p className="empty-text">No hay zonas configuradas.</p>
        )}
      </section>
    </>
  )
}
