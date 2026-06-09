import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { loadQuadrantDetail, loadQuadrants } from '../services/resourceService'
import type { QuadrantAssignment, QuadrantItem } from '../types/resources'

const DAY_LABELS_PLAIN = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const DAY_TITLES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HOUR_HEIGHT = 52
const WEEKLY_GRID_HEIGHT = 24 * HOUR_HEIGHT

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Sin fecha'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getWeekDays(weekStart: string | null | undefined) {
  const safeStart = weekStart ? new Date(weekStart) : new Date()
  const baseDate = Number.isNaN(safeStart.getTime()) ? new Date() : safeStart

  return DAY_TITLES.map((title, index) => {
    const date = new Date(baseDate)
    date.setDate(baseDate.getDate() + index)
    return {
      key: DAY_LABELS_PLAIN[index],
      title,
      dayNumber: date.toLocaleDateString('es-ES', { day: '2-digit' }),
      month: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
      iso: date.toISOString().slice(0, 10),
    }
  })
}

function normalizeDay(value: string | number | null | undefined) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function getMinutesFromTime(value: string | null | undefined) {
  if (!value) {
    return 0
  }

  const [hours, minutes] = value.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

function getDurationMinutes(assignment: QuadrantAssignment) {
  const start = getMinutesFromTime(assignment.start_time)
  const end = getMinutesFromTime(assignment.end_time)
  return Math.max(end - start, 45)
}

function getEventColor(seed: string) {
  const palette = ['#26547c', '#ef476f', '#118ab2', '#06d6a0', '#f4a261', '#8d5fd3', '#2a9d8f']
  const hash = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

export function QuadrantsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedQuadrantId, setSelectedQuadrantId] = useState<number | null>(null)
  const [textFilter, setTextFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const contextualClientId = searchParams.get('clientId')
  const contextualClientName = searchParams.get('clientName') ?? ''
  const contextualEmployeeName = searchParams.get('employeeName') ?? ''
  const effectiveTextFilter = (textFilter || contextualClientName || contextualEmployeeName).trim().toLowerCase()

  const quadrantsQuery = useQuery({
    queryKey: ['quadrants'],
    queryFn: loadQuadrants,
  })

  const quadrants = useMemo(
    () => [...(quadrantsQuery.data ?? [])].sort((left, right) => String(left.week_start ?? '').localeCompare(String(right.week_start ?? ''))),
    [quadrantsQuery.data],
  )

  const effectiveSelectedQuadrantId = selectedQuadrantId ?? (quadrants[0]?.id !== undefined ? Number(quadrants[0].id) : null)
  const selectedQuadrant = quadrants.find((quadrant) => Number(quadrant.id) === effectiveSelectedQuadrantId) ?? null
  const selectedIndex = quadrants.findIndex((quadrant) => Number(quadrant.id) === effectiveSelectedQuadrantId)

  const detailQuery = useQuery({
    queryKey: ['quadrants', effectiveSelectedQuadrantId],
    queryFn: () => loadQuadrantDetail(effectiveSelectedQuadrantId ?? 0),
    enabled: effectiveSelectedQuadrantId !== null,
  })

  const assignments = detailQuery.data?.assignments ?? []
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesClientId = !contextualClientId || String(assignment.client_id) === contextualClientId
    const searchable = `${assignment.employee_name ?? ''} ${assignment.client_name ?? ''} ${assignment.client_city ?? ''} ${assignment.client_address ?? ''}`.toLowerCase()
    const matchesText = !effectiveTextFilter || searchable.includes(effectiveTextFilter)
    return matchesClientId && matchesText
  })

  const weekDays = getWeekDays(selectedQuadrant?.week_start)
  const groupedAssignments = weekDays.map((day) => ({
    ...day,
    assignments: filteredAssignments.filter((assignment) => normalizeDay(assignment.day_of_week) === day.key),
  }))

  const employeeChips = Array.from(new Set(filteredAssignments.map((assignment) => assignment.employee_name).filter(Boolean)))
  const clientChips = Array.from(new Set(filteredAssignments.map((assignment) => assignment.client_name).filter(Boolean)))
  const totalServices = filteredAssignments.reduce((sum, assignment) => sum + (assignment.service_details?.length ?? 0), 0)

  const handleMoveWeek = (offset: -1 | 1) => {
    if (selectedIndex < 0) {
      return
    }

    const target = quadrants[selectedIndex + offset]
    if (target?.id !== undefined) {
      setSelectedQuadrantId(Number(target.id))
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Cuadrantes"
        subtitle="Vista semanal inspirada en el gestor legacy con navegación por semanas, filtros de contexto y resumen de asignaciones reales."
        title="Planificación semanal"
      />

      <section className="table-card resource-shell-card" id="tabCuadrantePersonal">
        <div className="section-head-row" style={{ marginBottom: '16px' }}>
          <div>
            <strong>{selectedQuadrant?.name ?? 'Selecciona una semana'}</strong>
            <p className="table-note">{selectedQuadrant ? `${selectedQuadrant.zone_name ?? 'Sin zona'} · Semana del ${formatDate(selectedQuadrant.week_start)}` : 'No hay cuadrantes disponibles todavía.'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)} type="button">Volver</button>
            <button className="btn btn-secondary" disabled={selectedIndex <= 0} onClick={() => handleMoveWeek(-1)} type="button">← Semana anterior</button>
            <button className="btn btn-secondary" disabled={selectedIndex < 0 || selectedIndex >= quadrants.length - 1} onClick={() => handleMoveWeek(1)} type="button">Semana siguiente →</button>
            <button className="btn btn-secondary" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} type="button">
              {viewMode === 'grid' ? 'Vista lista' : 'Vista cuadrícula'}
            </button>
            <button className="btn btn-primary" onClick={() => window.print()} type="button">PDF / Imprimir</button>
          </div>
        </div>

        <div className="gestion-filters-row" style={{ marginBottom: '16px' }}>
          <input
            className="gestion-filter-input gestion-filter-input-grow"
            onChange={(event) => setTextFilter(event.target.value)}
            placeholder={contextualClientName || contextualEmployeeName || 'Buscar por empleado, cliente o ciudad'}
            type="search"
            value={textFilter}
          />
          {(contextualClientId || contextualClientName || contextualEmployeeName || textFilter) ? (
            <button className="btn btn-secondary" onClick={() => { setTextFilter(''); navigate('/quadrants') }} type="button">Limpiar contexto</button>
          ) : null}
        </div>

        <div className="cuadrante-summary-panel">
          <div className="cuadrante-summary-panel-inline">
            <span className="cuadrante-summary-title">Resumen:</span>
            <span className="cuadrante-summary-chip">{filteredAssignments.length} turnos</span>
            <span className="cuadrante-summary-chip">{employeeChips.length} empleados</span>
            <span className="cuadrante-summary-chip">{clientChips.length} usuarios</span>
            <span className="cuadrante-summary-chip">{totalServices} servicios</span>
          </div>
          {employeeChips.length > 0 ? (
            <div className="cuadrante-summary-panel-inline">
              <span className="cuadrante-summary-title">Empleados:</span>
              {employeeChips.map((employee) => <span className="cuadrante-summary-chip cuadrante-summary-chip-tight" key={employee}>{employee}</span>)}
            </div>
          ) : null}
          {clientChips.length > 0 ? (
            <div className="cuadrante-summary-panel-inline">
              <span className="cuadrante-summary-title">Usuarios:</span>
              {clientChips.map((client) => <span className="cuadrante-summary-chip cuadrante-summary-chip-tight" key={client}>{client}</span>)}
            </div>
          ) : null}
        </div>

        {quadrantsQuery.isLoading ? <p className="empty-text">Cargando cuadrantes...</p> : null}
        {quadrantsQuery.isError ? <div className="error-banner">{quadrantsQuery.error.message}</div> : null}
        {detailQuery.isLoading ? <p className="empty-text">Cargando detalle semanal...</p> : null}
        {detailQuery.isError ? <div className="error-banner">{detailQuery.error.message}</div> : null}

        {viewMode === 'grid' ? (
          <div className="cuadrante-weekly-shell">
            <div className="cuadrante-weekly-grid">
              <div className="cuadrante-weekly-hours-column">
                <div className="cuadrante-weekly-header-spacer"></div>
                <div className="cuadrante-weekly-hours-track" style={{ height: `${WEEKLY_GRID_HEIGHT}px` }}>
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div key={hour}>
                      <div className="cuadrante-weekly-time-label" style={{ top: `${hour * HOUR_HEIGHT}px` }}>{String(hour).padStart(2, '0')}:00</div>
                      <div className="cuadrante-weekly-time-line" style={{ top: `${hour * HOUR_HEIGHT}px` }}></div>
                    </div>
                  ))}
                </div>
              </div>

              {groupedAssignments.map((day) => (
                <div className="cuadrante-weekly-day-column" key={day.iso}>
                  <div className="cuadrante-weekly-day-header">
                    <span className="cuadrante-weekly-day-name">{day.title}</span>
                    <span className="cuadrante-weekly-day-date">{day.dayNumber} {day.month}</span>
                  </div>
                  <div className="cuadrante-weekly-events-area" style={{ height: `${WEEKLY_GRID_HEIGHT}px` }}>
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div className="cuadrante-weekly-grid-line" key={`${day.iso}-${hour}`} style={{ top: `${hour * HOUR_HEIGHT}px` }}></div>
                    ))}
                    {day.assignments.map((assignment) => {
                      const top = (getMinutesFromTime(assignment.start_time) / 60) * HOUR_HEIGHT
                      const height = Math.max((getDurationMinutes(assignment) / 60) * HOUR_HEIGHT, 44)
                      const color = getEventColor(`${assignment.employee_name ?? ''}-${assignment.client_name ?? ''}`)
                      return (
                        <article
                          className="cuadrante-weekly-event"
                          key={assignment.id}
                          style={{ top: `${top}px`, height: `${height}px`, left: '4px', right: '4px', background: color }}
                        >
                          <div className="cuadrante-weekly-event-time">{assignment.start_time?.slice(0, 5)} - {assignment.end_time?.slice(0, 5)}</div>
                          <div className="cuadrante-weekly-event-client">{assignment.client_name ?? 'Usuario sin nombre'}</div>
                          <div className="cuadrante-weekly-event-employee">{assignment.employee_name ?? 'Empleado sin asignar'}</div>
                          {assignment.service_details && assignment.service_details.length > 0 ? (
                            <div className="cuadrante-weekly-event-services">
                              {assignment.service_details.slice(0, 2).map((service, index) => (
                                <span className="cuadrante-weekly-service-chip" key={`${assignment.id}-service-${index}`}>{service.name ?? 'Servicio'}</span>
                              ))}
                            </div>
                          ) : null}
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="legacy-list-grid">
            {groupedAssignments.map((day) => (
              <article className="legacy-list-card" key={day.iso}>
                <div className="legacy-list-card-head">
                  <div>
                    <strong>{day.title}</strong>
                    <span>{day.dayNumber} {day.month}</span>
                  </div>
                  <span className="status-pill">{day.assignments.length} turnos</span>
                </div>
                {day.assignments.length > 0 ? (
                  <div className="legacy-detail-grid">
                    {day.assignments.map((assignment) => (
                      <div key={assignment.id} className="client-overview-detail">
                        <span>{assignment.start_time?.slice(0, 5)} - {assignment.end_time?.slice(0, 5)}</span>
                        <strong>{assignment.employee_name ?? 'Empleado sin asignar'}</strong>
                        <small>{assignment.client_name ?? 'Usuario sin nombre'} · {assignment.client_city ?? 'Sin ciudad'}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">Sin turnos para este día.</p>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="cuadrante-weekly-legend">
          <span className="cuadrante-weekly-legend-item"><span className="cuadrante-weekly-legend-swatch" style={{ background: '#26547c' }}></span>Asignación activa</span>
          <span className="cuadrante-weekly-legend-item"><span className="cuadrante-weekly-legend-swatch" style={{ background: '#06d6a0' }}></span>Usuario o servicio alternativo</span>
          <span className="cuadrante-weekly-legend-item"><span className="cuadrante-weekly-legend-swatch" style={{ background: '#ef476f' }}></span>Cobertura especial</span>
        </div>
      </section>

      <section className="table-card resource-shell-card" style={{ marginTop: '1.5rem' }}>
        <div className="section-head-row">
          <div>
            <strong>Semanas disponibles</strong>
            <p className="table-note">Selecciona rápidamente el cuadrante que quieras comparar.</p>
          </div>
          <span className="status-pill">{quadrants.length} semanas</span>
        </div>
        <div className="legacy-list-grid quadrant-list-grid" style={{ marginTop: '1rem' }}>
          {quadrants.map((quadrant: QuadrantItem) => (
            <button
              className={`legacy-list-card legacy-list-button ${effectiveSelectedQuadrantId === Number(quadrant.id) ? 'is-active' : ''}`}
              key={quadrant.id}
              onClick={() => setSelectedQuadrantId(Number(quadrant.id))}
              type="button"
            >
              <div className="legacy-list-card-head">
                <div>
                  <strong>{quadrant.name}</strong>
                  <span>{quadrant.zone_name ?? 'Sin zona'}</span>
                </div>
                <span className="status-pill">{quadrant.total_assignments ?? 0}</span>
              </div>
              <div className="legacy-detail-grid">
                <div>
                  <span className="meta-label">Semana</span>
                  <p className="meta-value">{formatDate(quadrant.week_start)}</p>
                </div>
                <div>
                  <span className="meta-label">Creador</span>
                  <p className="meta-value">{quadrant.created_by_name ?? 'Sin creador'}</p>
                </div>
                <div>
                  <span className="meta-label">Tipo</span>
                  <p className="meta-value">{quadrant.is_template ? 'Plantilla' : 'Semana real'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}