import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loadRecords } from '../services/resourceService'

function formatDateTime(value: string | null | undefined): { date: string, time: string } {
  if (!value) {
    return { date: 'Sin fecha', time: 'Sin hora' }
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return { date: value, time: '' }
  }

  return {
    date: parsed.toLocaleDateString('es-ES'),
    time: parsed.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }
}

export function RecordsPage() {
  const [search, setSearch] = useState('')

  const recordsQuery = useQuery({
    queryKey: ['records'],
    queryFn: loadRecords,
  })

  const records = recordsQuery.data ?? []

  const filteredRecords = records.filter(record => 
    !search || (record.employee_name && record.employee_name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="card">
      <h2>🗂️ Todos los Fichajes</h2>
      <p className="text-muted text-spaced-after">Vista completa de fichajes de todos los empleados</p>

      <div className="fichajes-toolbar">
        <label className="fichajes-toolbar-label">Buscar empleado:</label>
        <input 
          type="text" 
          className="fichajes-toolbar-input" 
          placeholder="Nombre del empleado..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-danger fichajes-toolbar-btn">🗑️ Eliminar Seleccionados (<span id="selectedCount">0</span>)</button>
      </div>

      <div id="todosFichajesContent">
        {recordsQuery.isLoading ? <div className="loading">Cargando todos los fichajes...</div> : null}
        
        {recordsQuery.isError ? <div className="alert alert-error">Error al cargar fichajes</div> : null}

        {recordsQuery.data ? (
          filteredRecords.length === 0 ? (
            <p>No hay fichajes registrados para el filtro actual</p>
          ) : (
            <div className="table-responsive data-table-shell">
              <table id="fichajesTable" className="data-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" id="selectAll" /></th>
                    <th>ID</th>
                    <th>Empleado</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const { date, time } = formatDateTime(record.timestamp)
                    const location = record.is_teletrabajo ? '💻 Teletrabajo' : (record.client_name ?? record.zone_name ?? record.device ?? 'Sin ubicación')
                    
                    return (
                      <tr key={record.id} data-employee={(record.employee_name ?? '').toLowerCase()}>
                        <td data-label="Selección" className="table-selection-cell">
                          <input type="checkbox" className="fichaje-checkbox" value={record.id} />
                        </td>
                        <td data-label="ID" className="table-cell-subtle">{record.id}</td>
                        <td data-label="Empleado" className="table-cell-title">{record.employee_name ?? 'Sin nombre'}</td>
                        <td data-label="Fecha">{date}</td>
                        <td data-label="Hora">{time}</td>
                        <td data-label="Tipo">{record.type === 'entrada' ? '🟢 Entrada' : '🔴 Salida'}</td>
                        <td data-label="Ubicación" className="table-cell-subtle">{location}</td>
                        <td data-label="Estado">
                          {record.confirmed ? (
                            <span className="badge badge-success">Confirmado</span>
                          ) : (
                            <span className="badge badge-warning">Pendiente</span>
                          )}
                        </td>
                        <td data-label="Acciones" className="table-actions-cell">
                          <div className="table-actions">
                            <button className="btn btn-secondary btn-compact-action">✏️</button>
                            <button className="btn btn-danger btn-compact-action">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
