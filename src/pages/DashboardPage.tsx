import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loadDashboard } from '../services/dashboardService'
import { DashboardEmployeeCard } from '../components/DashboardEmployeeCard'

export function DashboardPage() {
  const [filter, setFilter] = useState<'all' | 'trabajando' | 'ausente' | 'vacaciones'>('all')

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: loadDashboard,
    refetchInterval: 30000, // Auto-actualizar cada 30 segundos como el original
  })

  if (dashboardQuery.isLoading) {
    return <div className="loading">Cargando dashboard...</div>
  }

  if (dashboardQuery.isError) {
    return <div className="alert alert-error">Error al cargar dashboard: {dashboardQuery.error.message}</div>
  }

  const { total = 0, trabajando = 0, ausente = 0, vacaciones = 0, employees = [] } = dashboardQuery.data ?? {}

  const filteredEmployees = filter === 'all' 
    ? employees 
    : employees.filter(emp => emp.status === filter)

  return (
    <div className="card">
      <h2>📊 Dashboard en Tiempo Real</h2>

      <div className="dashboard-summary-grid">
        <div className="stat-card stat-card-green">
          <h3>🟢 {trabajando}</h3>
          <p>Trabajando</p>
        </div>
        <div className="stat-card stat-card-red">
          <h3>🔴 {ausente}</h3>
          <p>Ausentes</p>
        </div>
        <div className="stat-card stat-card-blue">
          <h3>🏖️ {vacaciones}</h3>
          <p>De Vacaciones</p>
        </div>
        <div className="stat-card stat-card-purple">
          <h3>{total}</h3>
          <p>Total Empleados</p>
        </div>
      </div>

      <div className="dashboard-filter-row">
        <label className="dashboard-filter-label">Filtrar:</label>
        <button 
          className="btn btn-secondary btn-filter-gap" 
          style={filter === 'all' ? { outline: '2px solid #333' } : {}}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button 
          className="btn btn-dashboard-working btn-filter-gap" 
          style={filter === 'trabajando' ? { outline: '2px solid #333' } : {}}
          onClick={() => setFilter('trabajando')}
        >
          🟢 Trabajando
        </button>
        <button 
          className="btn btn-dashboard-absent btn-filter-gap" 
          style={filter === 'ausente' ? { outline: '2px solid #333' } : {}}
          onClick={() => setFilter('ausente')}
        >
          🔴 Ausentes
        </button>
        <button 
          className="btn btn-dashboard-vacation" 
          style={filter === 'vacaciones' ? { outline: '2px solid #333' } : {}}
          onClick={() => setFilter('vacaciones')}
        >
          🏖️ Vacaciones
        </button>
      </div>

      <div id="employeesList">
        {filteredEmployees.length === 0 ? (
          <p>No hay empleados en este estado.</p>
        ) : (
          <div className="dashboard-employees-grid">
            {filteredEmployees.map((employee) => (
              <DashboardEmployeeCard employee={employee} key={employee.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
