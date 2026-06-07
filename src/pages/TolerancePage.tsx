import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { loadZones } from '../services/resourceService'

interface ZoneToleranceSettings {
  zone_id: number
  default_entry_tolerance: number
  default_exit_tolerance: number
  notify_coordinator: boolean
  notify_after_minutes: number
  zone_name: string
}

export function TolerancePage() {
  const queryClient = useQueryClient()
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>('')

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: loadZones,
  })

  const zones = zonesQuery.data ?? []

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
      alert('Ajustes guardados correctamente')
    },
  })

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
      </section>

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
    </>
  )
}
