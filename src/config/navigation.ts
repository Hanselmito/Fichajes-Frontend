export const sectionLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  records: 'Fichajes',
  reports: 'Reportes',
  vacations: 'Vacaciones legacy',
  vacation_requests: 'Solicitudes de vacaciones',
  user_overview: 'Resumen de empleados',
  zones: 'Zonas',
  users: 'Usuarios',
  clients: 'Clientes',
  quadrants: 'Cuadrantes',
  schedules: 'Horarios',
  employee_schedules: 'Historial de horarios',
  services: 'Servicios',
  calendars: 'Calendarios',
  zone_holidays: 'Festivos de zona',
  tolerance: 'Tolerancias',
  bolsa_anotaciones: 'Bolsa de horas',
  notifications: 'Notificaciones',
  breaks: 'Descansos',
  modifications: 'Modificaciones',
}

export const loginFeatureCards = [
  {
    title: 'Estilo base legacy',
    detail: 'Cabecera clara, tarjetas blancas, navegacion lateral y acentos azules.',
  },
  {
    title: 'Contrato unico',
    detail: 'Tipos generados desde ../fichaje-backend/docs/openapi.yaml.',
  },
  {
    title: 'Sesion moderna',
    detail: 'Access token corto con refresh flow y restauracion automatica.',
  },
]