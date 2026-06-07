import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import { useAuth } from '../auth/useAuth'
import { AppShell } from '../components/AppShell'
import { BolsaAnotacionesPage } from '../pages/BolsaAnotacionesPage'
import { BreaksPage } from '../pages/BreaksPage'
import { CalendarsPage } from '../pages/CalendarsPage'
import { ClientsPage } from '../pages/ClientsPage'
import { ContractPage } from '../pages/ContractPage'
import { DashboardPage } from '../pages/DashboardPage'
import { FicharPage } from '../pages/FicharPage'
import { IncidenciasPage } from '../pages/IncidenciasPage'
import { LoginPage } from '../pages/LoginPage'
import { ModificationsPage } from '../pages/ModificationsPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { QuadrantsPage } from '../pages/QuadrantsPage'
import { ReadinessPage } from '../pages/ReadinessPage'
import { RecordsPage } from '../pages/RecordsPage'
import { ReportsPage } from '../pages/ReportsPage'
import { SchedulesPage } from '../pages/SchedulesPage'
import { ServicesPage } from '../pages/ServicesPage'
import { TolerancePage } from '../pages/TolerancePage'
import { UsersPage } from '../pages/UsersPage'
import { VacationsPage } from '../pages/VacationsPage'
import { ZoneHolidaysPage } from '../pages/ZoneHolidaysPage'
import { ZonesPage } from '../pages/ZonesPage'

function ProtectedRoutes() {
  const { initializing, isAuthenticated } = useAuth()

  if (initializing) {
    return <div className="screen-state">Restaurando sesion y capacidades...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="fichar" element={<FicharPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="zones" element={<ZonesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="vacations" element={<VacationsPage />} />
        <Route path="quadrants" element={<QuadrantsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="bolsa-anotaciones" element={<BolsaAnotacionesPage />} />
        <Route path="breaks" element={<BreaksPage />} />
        <Route path="calendars" element={<CalendarsPage />} />
        <Route path="incidencias" element={<IncidenciasPage />} />
        <Route path="modifications" element={<ModificationsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="tolerance" element={<TolerancePage />} />
        <Route path="zone-holidays" element={<ZoneHolidaysPage />} />
        <Route path="contract" element={<ContractPage />} />
        <Route path="readiness" element={<ReadinessPage />} />
        <Route path="workspace/:sectionId" element={<PlaceholderPage />} />
      </Route>
    </Routes>
  )
}

function PublicRoutes() {
  const { initializing, isAuthenticated } = useAuth()

  if (initializing) {
    return <div className="screen-state">Comprobando sesion...</div>
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function RoutedApplication() {
  const { isAuthenticated } = useAuth()

  return isAuthenticated ? <ProtectedRoutes /> : <PublicRoutes />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutedApplication />
      </AuthProvider>
    </BrowserRouter>
  )
}