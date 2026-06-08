import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
    <div className="card">
      <h2>🗺️ Gestión de Zonas</h2>
      <p>Administración de zonas de trabajo y generación de códigos QR para fichaje.</p>
      
      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <span className="meta-label">Total zonas:</span>
          <strong> {totalZones}</strong>
        </div>
        <div>
          <span className="meta-label">Con QR activo:</span>
          <strong style={{ color: '#38a169' }}> {zonesWithQr}</strong>
        </div>
        <div>
          <span className="meta-label">Sin QR:</span>
          <strong style={{ color: '#d69e2e' }}> {totalZones - zonesWithQr}</strong>
        </div>
      </div>

      {!isFormVisible && (
        <button className="btn btn-primary" onClick={() => handleOpenForm()} type="button" style={{ marginBottom: '1rem' }}>
          ➕ Nueva Zona
        </button>
      )}

      {isFormVisible ? (
        <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '8px' }}>
          <div className="section-head-row">
            <div>
              <strong>{editingZone ? 'Editar zona' : 'Nueva zona'}</strong>
              <p className="table-note">Completa los datos de la zona de trabajo.</p>
            </div>
            <button className="btn btn-secondary" onClick={handleCloseForm} type="button">
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
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
            </div>

            <div className="inline-actions" style={{ marginTop: '1rem' }}>
              <button
                className="btn btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
                type="submit"
              >
                {editingZone ? 'Guardar Cambios' : 'Crear Zona'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="section-head-row">
        <div>
          <strong>Listado de zonas</strong>
          <p className="table-note">Zonas configuradas en el sistema para asignación y fichaje.</p>
        </div>
      </div>

      {zonesQuery.isLoading ? <p className="empty-text">Cargando zonas...</p> : null}
      {zonesQuery.isError ? (
        <div className="alert alert-error">{zonesQuery.error.message}</div>
      ) : null}

      {zones.length > 0 ? (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Código QR</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td>{zone.id}</td>
                  <td>{zone.name}</td>
                  <td>{zone.address ? `${zone.address}, ${zone.city || ''}` : 'Sin dirección'}</td>
                  <td>
                    {zone.qr_code ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {zone.qr_code}
                      </span>
                    ) : 'Sin QR'}
                  </td>
                  <td>
                    {zone.id && (
                      <button
                        className="btn btn-secondary btn-compact-action btn-action-right-gap"
                        onClick={() => handleOpenForm(zone)}
                        type="button"
                      >
                        ✏️ Editar
                      </button>
                    )}
                    {zone.id && (
                      <button
                        className="btn btn-success btn-compact-action btn-action-right-gap"
                        onClick={() => handleRegenerateQr(zone.id!)}
                        type="button"
                        style={{ marginLeft: '4px' }}
                      >
                        🔄 QR
                      </button>
                    )}
                    {zone.id && (
                      <button
                        className="btn btn-danger btn-compact-action"
                        onClick={() => handleDelete(zone.id!)}
                        type="button"
                        style={{ marginLeft: '4px' }}
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !zonesQuery.isLoading && <p className="empty-text">No hay zonas configuradas.</p>
      )}
    </div>
  )
}
