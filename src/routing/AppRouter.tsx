import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import { useAuth } from '../auth/useAuth'
import { AppShell } from '../components/AppShell'
import { ClientsPage } from '../pages/ClientsPage'
import { ContractPage } from '../pages/ContractPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { QuadrantsPage } from '../pages/QuadrantsPage'
import { RecordsPage } from '../pages/RecordsPage'
import { ReadinessPage } from '../pages/ReadinessPage'
import { UsersPage } from '../pages/UsersPage'

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
        <Route path="records" element={<RecordsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="quadrants" element={<QuadrantsPage />} />
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