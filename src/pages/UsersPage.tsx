import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { loadDashboard } from '../services/dashboardService'
import { createUser, deleteUser, loadUsers, loadZones, updateUser } from '../services/resourceService'
import type { UserItem, ZoneItem } from '../types/resources'

type EditorTab = 'editor' | 'schedule' | 'permissions'

type CalendarOption = {
  id: number
  name: string
}

type ScheduleApiItem = {
  day_of_week: string
  is_workday: number
  shift_start_1?: string | null
  shift_end_1?: string | null
  shift_start_2?: string | null
  shift_end_2?: string | null
}

type ScheduleSegmentDraft = {
  start: string
  end: string
}

type ScheduleDayDraft = {
  dayOfWeek: number
  label: string
  enabled: boolean
  segments: ScheduleSegmentDraft[]
}

type UserFormState = {
  username: string
  password: string
  name: string
  email: string
  phone: string
  dni: string
  role: 'admin' | 'coordinator' | 'employee'
  zoneId: number | ''
  calendarId: number | ''
  active: boolean
}

type PermissionState = {
  can_view_reports: boolean
  can_view_reports_zone_ids: number[]
  can_view_all_records: boolean
  can_view_all_records_zone_ids: number[]
  can_view_all_bolsa: boolean
  can_view_all_bolsa_zone_ids: number[]
  can_view_all_dashboard: boolean
  can_view_all_dashboard_zone_ids: number[]
  can_view_user_overview: boolean
  can_view_user_overview_zone_ids: number[]
  can_view_coordinators_in_employee_view: boolean
  can_view_coordinators_in_employee_view_zone_ids: number[]
  can_view_all_vacations: boolean
  can_view_all_vacations_zone_ids: number[]
  can_promote_to_coordinator: boolean
  role: 'admin' | 'coordinator' | 'employee'
}

type PermissionConfig = {
  key: keyof PermissionState
  zoneKey?: keyof PermissionState
  title: string
  description: string
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_VALUE_NAMES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const DAY_NAME_TO_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
}

const PERMISSION_CONFIGS: PermissionConfig[] = [
  {
    key: 'can_view_reports',
    zoneKey: 'can_view_reports_zone_ids',
    title: 'Ver los reportes',
    description: 'Permite acceder a la pestaña de reportes y estadísticas.',
  },
  {
    key: 'can_view_all_records',
    zoneKey: 'can_view_all_records_zone_ids',
    title: 'Todos los fichajes por zona',
    description: 'Selecciona las zonas adicionales que podrá consultar en el sub-tab de Todos los Fichajes.',
  },
  {
    key: 'can_view_all_bolsa',
    zoneKey: 'can_view_all_bolsa_zone_ids',
    title: 'Bolsa de horas por zona',
    description: 'Selecciona las zonas adicionales en las que este usuario podrá consultar la bolsa de horas.',
  },
  {
    key: 'can_view_all_dashboard',
    zoneKey: 'can_view_all_dashboard_zone_ids',
    title: 'Dashboard por zona',
    description: 'Selecciona las zonas adicionales que podrá ver en el dashboard.',
  },
  {
    key: 'can_view_user_overview',
    zoneKey: 'can_view_user_overview_zone_ids',
    title: 'Vista de usuarios por zona',
    description: 'Selecciona los usuarios/clientes adicionales visibles dentro de la vista de usuarios.',
  },
  {
    key: 'can_view_coordinators_in_employee_view',
    zoneKey: 'can_view_coordinators_in_employee_view_zone_ids',
    title: 'Incluir coordinadores en vista de empleados',
    description: 'Controla si puede incluir coordinadores dentro de la vista de empleados.',
  },
  {
    key: 'can_view_all_vacations',
    zoneKey: 'can_view_all_vacations_zone_ids',
    title: 'Vacaciones de otros coordinadores',
    description: 'Selecciona las zonas adicionales para consultar vacaciones de otros coordinadores y sus equipos.',
  },
]

const DEFAULT_PERMISSIONS: PermissionState = {
  can_view_reports: false,
  can_view_reports_zone_ids: [],
  can_view_all_records: false,
  can_view_all_records_zone_ids: [],
  can_view_all_bolsa: false,
  can_view_all_bolsa_zone_ids: [],
  can_view_all_dashboard: false,
  can_view_all_dashboard_zone_ids: [],
  can_view_user_overview: false,
  can_view_user_overview_zone_ids: [],
  can_view_coordinators_in_employee_view: false,
  can_view_coordinators_in_employee_view_zone_ids: [],
  can_view_all_vacations: false,
  can_view_all_vacations_zone_ids: [],
  can_promote_to_coordinator: false,
  role: 'employee',
}

function calculateHoursBetween(start: string, end: string) {
  if (!start || !end) {
    return 0
  }

  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute

  if (Number.isNaN(startTotal) || Number.isNaN(endTotal) || endTotal <= startTotal) {
    return 0
  }

  return (endTotal - startTotal) / 60
}

function formatHours(totalHours: number) {
  const safeHours = Number.isFinite(totalHours) ? totalHours : 0
  const hours = Math.floor(safeHours)
  const minutes = Math.round((safeHours - hours) * 60)
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

function buildDefaultScheduleDays(): ScheduleDayDraft[] {
  return DAY_NAMES.map((label, index) => ({
    dayOfWeek: index,
    label,
    enabled: index >= 1 && index <= 5,
    segments: index >= 1 && index <= 5 ? [{ start: '09:00', end: '17:00' }] : [],
  }))
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getDayTotal(day: ScheduleDayDraft) {
  if (!day.enabled) {
    return 0
  }

  return day.segments.reduce((sum, segment) => sum + calculateHoursBetween(segment.start, segment.end), 0)
}

function buildFormDataForUser(user: UserItem | null, defaultRole: 'admin' | 'coordinator' | 'employee', coordinatorZoneId?: number | null): UserFormState {
  if (!user) {
    return {
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      dni: '',
      role: defaultRole,
      zoneId: defaultRole === 'employee' || defaultRole === 'coordinator' ? coordinatorZoneId ?? '' : '',
      calendarId: '',
      active: true,
    }
  }

  const zoneId: number | '' = user.zone_id == null ? '' : Number(user.zone_id)
  const calendarId: number | '' = user.calendar_id == null ? '' : Number(user.calendar_id)

  return {
    username: user.username,
    password: '',
    name: user.name,
    email: user.email ?? '',
    phone: user.phone ?? '',
    dni: user.dni ?? '',
    role: user.role,
    zoneId,
    calendarId,
    active: user.active ?? true,
  }
}

function buildPermissionsForUser(user: UserItem | null, defaultRole: 'admin' | 'coordinator' | 'employee'): PermissionState {
  if (!user) {
    return { ...DEFAULT_PERMISSIONS, role: defaultRole }
  }

  return {
    can_view_reports: Boolean(user.can_view_reports),
    can_view_reports_zone_ids: user.can_view_reports_zone_ids ?? [],
    can_view_all_records: Boolean(user.can_view_all_records),
    can_view_all_records_zone_ids: user.can_view_all_records_zone_ids ?? [],
    can_view_all_bolsa: Boolean(user.can_view_all_bolsa),
    can_view_all_bolsa_zone_ids: user.can_view_all_bolsa_zone_ids ?? [],
    can_view_all_dashboard: Boolean(user.can_view_all_dashboard),
    can_view_all_dashboard_zone_ids: user.can_view_all_dashboard_zone_ids ?? [],
    can_view_user_overview: Boolean(user.can_view_user_overview),
    can_view_user_overview_zone_ids: user.can_view_user_overview_zone_ids ?? [],
    can_view_coordinators_in_employee_view: Boolean(user.can_view_coordinators_in_employee_view),
    can_view_coordinators_in_employee_view_zone_ids: user.can_view_coordinators_in_employee_view_zone_ids ?? [],
    can_view_all_vacations: Boolean(user.can_view_all_vacations),
    can_view_all_vacations_zone_ids: user.can_view_all_vacations_zone_ids ?? [],
    can_promote_to_coordinator: Boolean(user.can_promote_to_coordinator),
    role: user.role,
  }
}

function buildScheduleDaysFromApi(scheduleItems: ScheduleApiItem[] | undefined): ScheduleDayDraft[] {
  if (!scheduleItems || scheduleItems.length === 0) {
    return buildDefaultScheduleDays()
  }

  return buildDefaultScheduleDays().map((defaultDay) => {
    const apiDay = scheduleItems.find((candidate) => DAY_NAME_TO_INDEX[candidate.day_of_week.toLowerCase()] === defaultDay.dayOfWeek)
    if (!apiDay) {
      return defaultDay
    }

    const segments: ScheduleSegmentDraft[] = []
    if (apiDay.shift_start_1 && apiDay.shift_end_1) {
      segments.push({ start: apiDay.shift_start_1.slice(0, 5), end: apiDay.shift_end_1.slice(0, 5) })
    }
    if (apiDay.shift_start_2 && apiDay.shift_end_2) {
      segments.push({ start: apiDay.shift_start_2.slice(0, 5), end: apiDay.shift_end_2.slice(0, 5) })
    }

    return {
      ...defaultDay,
      enabled: Number(apiDay.is_workday) === 1,
      segments: Number(apiDay.is_workday) === 1 ? (segments.length > 0 ? segments : [{ start: '09:00', end: '17:00' }]) : [],
    }
  })
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<EditorTab>('editor')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [copiedDay, setCopiedDay] = useState<ScheduleDayDraft | null>(null)
  const [openZonePicker, setOpenZonePicker] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null)
  const [scheduleTouched, setScheduleTouched] = useState(false)
  const [formData, setFormData] = useState<UserFormState>({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    dni: '',
    role: 'employee' as 'admin' | 'coordinator' | 'employee',
    zoneId: '' as number | '',
    calendarId: '' as number | '',
    active: true,
  })
  const [scheduleDays, setScheduleDays] = useState<ScheduleDayDraft[]>(buildDefaultScheduleDays())
  const [scheduleWeeklyHours, setScheduleWeeklyHours] = useState(40)
  const [scheduleEffectiveDate, setScheduleEffectiveDate] = useState(new Date().toISOString().slice(0, 10))
  const [permissionsForm, setPermissionsForm] = useState<PermissionState>(DEFAULT_PERMISSIONS)

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: loadUsers })
  const zonesQuery = useQuery({ queryKey: ['zones'], queryFn: loadZones })
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: loadDashboard })

  const calendarsQuery = useQuery({
    queryKey: ['calendars_for_users'],
    queryFn: async (): Promise<CalendarOption[]> => {
      const result = await withAccessRefresh(() => apiClient.GET('/calendars'))
      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los calendarios'))
      }
      const data = result.data as unknown as { calendars?: CalendarOption[] } | CalendarOption[]
      return (Array.isArray(data) ? data : data.calendars) ?? []
    },
  })

  const schedulesQuery = useQuery({
    queryKey: ['employee_schedules', editingUser?.id],
    queryFn: async (): Promise<ScheduleApiItem[]> => {
      const result = await withAccessRefresh(() => apiClient.GET('/employee-schedules', {
        params: { query: { employeeId: Number(editingUser?.id) } },
      }))
      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'No se pudieron cargar los horarios del empleado'))
      }
      const data = result.data as unknown as { schedules?: ScheduleApiItem[] }
      return data.schedules ?? []
    },
    enabled: Boolean(editingUser?.id) && isFormVisible,
  })

  const users = usersQuery.data ?? []
  const zones = zonesQuery.data ?? []
  const calendars = calendarsQuery.data ?? []
  const dashboardEmployees = dashboardQuery.data?.employees ?? []
  const dashboardById = new Map(dashboardEmployees.map((employee) => [Number(employee.id), employee]))
  const workingUsers = dashboardQuery.data?.trabajando ?? 0
  const vacationUsers = dashboardQuery.data?.vacaciones ?? 0
  const inactiveUsers = users.filter((candidate) => !candidate.active).length
  const canManageAdvancedPermissions = user?.role === 'admin'
  const canDeleteUsers = user?.role === 'admin' || user?.role === 'coordinator'
  const scheduleDaysFromQuery = useMemo(() => buildScheduleDaysFromApi(schedulesQuery.data), [schedulesQuery.data])
  const effectiveScheduleDays = editingUser && !scheduleTouched ? scheduleDaysFromQuery : scheduleDays

  const filteredUsers = users.filter((candidate) =>
    (!search
      || candidate.name.toLowerCase().includes(search.toLowerCase())
      || (candidate.zone_name && candidate.zone_name.toLowerCase().includes(search.toLowerCase()))
      || (dashboardById.get(Number(candidate.id))?.current_client_name ?? '').toLowerCase().includes(search.toLowerCase())
      || (dashboardById.get(Number(candidate.id))?.next_assignment?.client_name ?? '').toLowerCase().includes(search.toLowerCase()))
    && (statusFilter === 'all' || (statusFilter === 'active' ? Boolean(candidate.active) : !candidate.active))
    && candidate.role !== 'admin'
  )

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFeedback({ tone: 'success', message: 'Usuario creado correctamente.' })
      handleCloseForm()
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateUser>[1] }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFeedback({ tone: 'success', message: 'Datos del usuario guardados.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser?.id) {
        return
      }

      const schedules = effectiveScheduleDays.map((day) => ({
        day_of_week: DAY_VALUE_NAMES[day.dayOfWeek],
        is_workday: day.enabled ? 1 : 0,
        segments: day.enabled
          ? day.segments
              .filter((segment) => segment.start && segment.end)
              .map((segment) => ({ start_time: `${segment.start}:00`, end_time: `${segment.end}:00` }))
          : [],
      }))

      const result = await withAccessRefresh(() => apiClient.POST('/employee-schedules', {
        body: {
          employeeId: editingUser.id,
          effective_date: scheduleEffectiveDate,
          weekly_hours: scheduleWeeklyHours,
          schedules,
        },
      }))

      if (result.error || !result.data?.success) {
        throw new Error(getErrorMessage(result.error, 'No se pudo guardar el horario'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee_schedules', editingUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFeedback({ tone: 'success', message: 'Horario guardado correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const permissionsMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser?.id) {
        return
      }

      await updateUser(editingUser.id, {
        role: permissionsForm.role,
        can_view_reports: permissionsForm.can_view_reports,
        can_view_reports_zone_ids: permissionsForm.can_view_reports_zone_ids,
        can_view_all_records: permissionsForm.can_view_all_records,
        can_view_all_records_zone_ids: permissionsForm.can_view_all_records_zone_ids,
        can_view_all_bolsa: permissionsForm.can_view_all_bolsa,
        can_view_all_bolsa_zone_ids: permissionsForm.can_view_all_bolsa_zone_ids,
        can_view_all_dashboard: permissionsForm.can_view_all_dashboard,
        can_view_all_dashboard_zone_ids: permissionsForm.can_view_all_dashboard_zone_ids,
        can_view_user_overview: permissionsForm.can_view_user_overview,
        can_view_user_overview_zone_ids: permissionsForm.can_view_user_overview_zone_ids,
        can_view_coordinators_in_employee_view: permissionsForm.can_view_coordinators_in_employee_view,
        can_view_coordinators_in_employee_view_zone_ids: permissionsForm.can_view_coordinators_in_employee_view_zone_ids,
        can_view_all_vacations: permissionsForm.can_view_all_vacations,
        can_view_all_vacations_zone_ids: permissionsForm.can_view_all_vacations_zone_ids,
        can_promote_to_coordinator: permissionsForm.can_promote_to_coordinator,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFeedback({ tone: 'success', message: 'Permisos avanzados guardados correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setFeedback({ tone: 'success', message: 'Usuario eliminado correctamente.' })
    },
    onError: (error: Error) => setFeedback({ tone: 'danger', message: error.message }),
  })

  const weeklyHoursCalculated = effectiveScheduleDays.reduce((sum, day) => sum + getDayTotal(day), 0)
  const weeklyBalance = weeklyHoursCalculated - scheduleWeeklyHours

  const handleOpenForm = (userToEdit?: UserItem, defaultRole: 'admin' | 'coordinator' | 'employee' = 'employee') => {
    setFeedback(null)
    setActiveTab('editor')
    setCopiedDay(null)
    setOpenZonePicker(null)
    setScheduleTouched(false)

    if (userToEdit) {
      setEditingUser(userToEdit)
      setFormData(buildFormDataForUser(userToEdit, userToEdit.role, user?.zone_id ?? null))
      setScheduleDays(buildDefaultScheduleDays())
      setScheduleWeeklyHours(Number(userToEdit.weekly_hours ?? 40))
      setPermissionsForm(buildPermissionsForUser(userToEdit, userToEdit.role))
    } else {
      setEditingUser(null)
      setFormData(buildFormDataForUser(null, defaultRole, user?.role === 'coordinator' ? user.zone_id ?? null : null))
      setScheduleDays(buildDefaultScheduleDays())
      setScheduleWeeklyHours(40)
      setPermissionsForm(buildPermissionsForUser(null, defaultRole))
    }

    setIsFormVisible(true)
  }

  const handleCloseForm = () => {
    setIsFormVisible(false)
    setEditingUser(null)
    setActiveTab('editor')
    setOpenZonePicker(null)
  }

  const handleDelete = (userId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      deleteMutation.mutate(userId)
    }
  }

  const handleEditorSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const payload = {
      username: formData.username,
      password: formData.password,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      dni: formData.dni || null,
      role: formData.role,
      zoneId: formData.zoneId === '' ? null : Number(formData.zoneId),
      active: formData.active,
      calendar_id: formData.calendarId === '' ? null : Number(formData.calendarId),
      weekly_hours: scheduleWeeklyHours,
    }

    if (editingUser?.id) {
      if (!payload.password) {
        delete (payload as Partial<typeof payload>).password
      }
      updateMutation.mutate({ id: editingUser.id, data: payload })
      return
    }

    createMutation.mutate(payload)
  }

  const updateScheduleDay = (dayOfWeek: number, updater: (current: ScheduleDayDraft) => ScheduleDayDraft) => {
    setScheduleTouched(true)
    setScheduleDays((current) => {
      const sourceDays = !scheduleTouched && editingUser ? scheduleDaysFromQuery : current
      return sourceDays.map((day) => (day.dayOfWeek === dayOfWeek ? updater(day) : day))
    })
  }

  const handleCopyDay = (day: ScheduleDayDraft) => {
    setCopiedDay({
      ...day,
      segments: day.segments.map((segment) => ({ ...segment })),
    })
  }

  const handlePasteDay = (dayOfWeek: number) => {
    if (!copiedDay) {
      return
    }

    updateScheduleDay(dayOfWeek, () => ({
      ...copiedDay,
      dayOfWeek,
      label: DAY_NAMES[dayOfWeek],
      segments: copiedDay.segments.map((segment) => ({ ...segment })),
    }))
  }

  const togglePermissionZone = (zoneKey: keyof PermissionState, zoneId: number) => {
    setPermissionsForm((current) => {
      const currentValue = current[zoneKey]
      if (!Array.isArray(currentValue)) {
        return current
      }

      return {
        ...current,
        [zoneKey]: currentValue.includes(zoneId)
          ? currentValue.filter((candidate) => candidate !== zoneId)
          : [...currentValue, zoneId],
      }
    })
  }

  const getSelectedZoneNames = (zoneIds: number[], availableZones: ZoneItem[]) => {
    if (zoneIds.length === 0) {
      return 'Sin acceso adicional'
    }

    return availableZones
      .filter((zone) => zone.id !== undefined && zoneIds.includes(Number(zone.id)))
      .map((zone) => zone.name)
      .join(', ')
  }

  return (
    <>
      {feedback ? (
        <div className={`status-pill ${feedback.tone === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '1rem' }}>
          {feedback.message}
        </div>
      ) : null}

      {isFormVisible ? (
        <div className="modal active" onClick={handleCloseForm}>
          <div className="modal-content modal-edit-user-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            </div>

            <div className="modal-inner-tabs">
              <button className={`modal-inner-tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')} type="button">
                Editor de usuario
              </button>
              <button className={`modal-inner-tab ${activeTab === 'schedule' ? 'active' : ''}`} disabled={!editingUser} onClick={() => setActiveTab('schedule')} type="button">
                Gestión de horarios
              </button>
              {canManageAdvancedPermissions ? (
                <button className={`modal-inner-tab ${activeTab === 'permissions' ? 'active' : ''}`} disabled={!editingUser} onClick={() => setActiveTab('permissions')} type="button">
                  Permisos avanzados
                </button>
              ) : null}
            </div>

            <div className={`modal-inner-panel ${activeTab === 'editor' ? 'active' : ''}`}>
              <form id="formEditUser" onSubmit={handleEditorSubmit}>
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
                </div>
                <div className="form-group">
                  <label>Usuario *</label>
                  <input required value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
                </div>
                <div className="form-group">
                  <label>{editingUser ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}</label>
                  <input required={!editingUser} type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} />
                </div>
                <div className="form-group">
                  <label>DNI</label>
                  <input value={formData.dni} onChange={(event) => setFormData({ ...formData, dni: event.target.value })} />
                </div>
                <div className="form-group">
                  <label>Zona</label>
                  <select disabled={user?.role === 'coordinator'} value={formData.zoneId} onChange={(event) => setFormData({ ...formData, zoneId: event.target.value === '' ? '' : Number(event.target.value) })}>
                    <option value="">Sin zona</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Calendario de festivos</label>
                  <div className="edit-user-calendar-row">
                    <select className="edit-user-calendar-select" value={formData.calendarId} onChange={(event) => setFormData({ ...formData, calendarId: event.target.value === '' ? '' : Number(event.target.value) })}>
                      <option value="">Calendario de la zona (por defecto)</option>
                      {calendars.map((calendar) => (
                        <option key={calendar.id} value={calendar.id}>{calendar.name}</option>
                      ))}
                    </select>
                    {formData.calendarId !== '' ? (
                      <button className="btn btn-secondary btn-compact" onClick={() => setFormData({ ...formData, calendarId: '' })} type="button">
                        ✕ Quitar
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="form-group">
                  <label>Rol *</label>
                  <select disabled={!canManageAdvancedPermissions} value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value as typeof formData.role })}>
                    <option value="employee">Empleado</option>
                    <option value="coordinator">Coordinador</option>
                    {canManageAdvancedPermissions ? <option value="admin">Administrador</option> : null}
                  </select>
                  <small className="edit-user-role-help">Los cambios de rango completos se gestionan desde permisos avanzados cuando el administrador lo autoriza.</small>
                </div>
                {editingUser ? (
                  <div className="form-group">
                    <label className="calendar-toggle-label">
                      <input checked={formData.active} onChange={(event) => setFormData({ ...formData, active: event.target.checked })} type="checkbox" />
                      Usuario Activo
                    </label>
                  </div>
                ) : null}
                <div className="modal-actions modal-footer-inline-actions modal-footer-inline-actions-spaced">
                  <button className="btn btn-secondary" onClick={handleCloseForm} type="button">Cancelar</button>
                  <button className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>

            <div className={`modal-inner-panel ${activeTab === 'schedule' ? 'active' : ''}`}>
              <div className="schedule-summary-card">
                <div>
                  <strong>Gestión de horas de contrato</strong>
                  <p>Configura las horas de contrato y compara el horario semanal calculado con el saldo real.</p>
                </div>
                <div className="schedule-summary-metrics">
                  <div className="schedule-summary-metric">
                    <span>Horas semanales</span>
                    <strong className="schedule-summary-value">{formatHours(weeklyHoursCalculated)}</strong>
                  </div>
                  <div className="schedule-summary-metric schedule-summary-metric-input">
                    <label>Horas de contrato</label>
                    <input min="0" step="0.5" type="number" value={scheduleWeeklyHours} onChange={(event) => setScheduleWeeklyHours(Number(event.target.value))} />
                  </div>
                  <div className="schedule-summary-metric schedule-summary-metric-input">
                    <label>Vigente desde</label>
                    <input type="date" value={scheduleEffectiveDate} onChange={(event) => setScheduleEffectiveDate(event.target.value)} />
                  </div>
                  <div className="schedule-summary-metric">
                    <span>Saldo semanal</span>
                    <strong className={weeklyBalance >= 0 ? 'text-success' : 'text-danger'}>{weeklyBalance >= 0 ? '+' : '-'}{formatHours(Math.abs(weeklyBalance))}</strong>
                    <small>{weeklyBalance >= 0 ? 'Hay más horas planificadas que horas de contrato.' : 'Faltan horas para llegar al contrato.'}</small>
                  </div>
                </div>
              </div>

              <div className="schedule-clipboard-bar" style={{ marginBottom: '16px' }}>
                <strong>{copiedDay ? `Copiado: ${copiedDay.label}` : 'Copia un día para poder pegarlo en otro.'}</strong>
              </div>

              {schedulesQuery.isLoading ? <p className="empty-text">Cargando horario...</p> : null}

              <div id="scheduleEditorContainer">
                <table>
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Trabaja</th>
                      <th>Horario</th>
                      <th>Horas del día</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectiveScheduleDays.map((day) => (
                      <tr key={day.dayOfWeek}>
                        <td>{day.label}</td>
                        <td className="schedule-work-cell">
                          <input className="schedule-work-toggle" checked={day.enabled} onChange={(event) => updateScheduleDay(day.dayOfWeek, (current) => ({
                            ...current,
                            enabled: event.target.checked,
                            segments: event.target.checked ? (current.segments.length > 0 ? current.segments : [{ start: '09:00', end: '17:00' }]) : [],
                          }))} type="checkbox" />
                        </td>
                        <td>
                          <div className="weekly-schedule-row" style={{ display: 'grid', gap: '10px' }}>
                            {day.enabled && day.segments.length > 0 ? day.segments.map((segment, segmentIndex) => (
                              <div className="schedule-time-range" key={`${day.dayOfWeek}-${segmentIndex}`} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="weekly-shift-label">Tramo {segmentIndex + 1}</span>
                                <input type="time" value={segment.start} onChange={(event) => updateScheduleDay(day.dayOfWeek, (current) => ({
                                  ...current,
                                  segments: current.segments.map((candidate, index) => index === segmentIndex ? { ...candidate, start: event.target.value } : candidate),
                                }))} />
                                <span>a</span>
                                <input type="time" value={segment.end} onChange={(event) => updateScheduleDay(day.dayOfWeek, (current) => ({
                                  ...current,
                                  segments: current.segments.map((candidate, index) => index === segmentIndex ? { ...candidate, end: event.target.value } : candidate),
                                }))} />
                                {segmentIndex > 0 ? (
                                  <button className="btn btn-secondary btn-compact" onClick={() => updateScheduleDay(day.dayOfWeek, (current) => ({
                                    ...current,
                                    segments: current.segments.filter((_, index) => index !== segmentIndex),
                                  }))} type="button">
                                    Quitar tramo
                                  </button>
                                ) : null}
                              </div>
                            )) : <span className="empty-text">Día sin horario</span>}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button className="btn btn-primary btn-compact" disabled={!day.enabled || day.segments.length >= 2} onClick={() => updateScheduleDay(day.dayOfWeek, (current) => ({
                                ...current,
                                segments: [...current.segments, { start: '15:00', end: '18:00' }],
                              }))} type="button">
                                Añadir otro horario
                              </button>
                              <button className="btn btn-secondary btn-compact" onClick={() => handleCopyDay(day)} type="button">Copiar día</button>
                              <button className="btn btn-secondary btn-compact" disabled={!copiedDay} onClick={() => handlePasteDay(day.dayOfWeek)} type="button">Pegar aquí</button>
                            </div>
                          </div>
                        </td>
                        <td><strong>{formatHours(getDayTotal(day))}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="schedule-help-card">
                <strong>💡 Instrucciones:</strong>
                <ul className="schedule-help-list">
                  <li>Marca los días que trabaja el empleado.</li>
                  <li>Desmarca los días de descanso.</li>
                  <li>Puedes añadir hasta dos tramos por día.</li>
                  <li>Copia un día y pégalo en otro para no rellenar las horas una a una.</li>
                  <li>Solo se cuentan los tramos con hora de inicio y fin válidas.</li>
                  <li>Las horas del día y de la semana se calculan automáticamente.</li>
                </ul>
              </div>

              <div className="modal-footer-inline-actions" style={{ marginTop: '20px' }}>
                <button className="btn btn-secondary" onClick={handleCloseForm} type="button">Cancelar</button>
                <button className="btn btn-primary" disabled={scheduleMutation.isPending || !editingUser} onClick={() => scheduleMutation.mutate()} type="button">Guardar Horario</button>
              </div>
            </div>

            <div className={`modal-inner-panel ${activeTab === 'permissions' ? 'active' : ''}`}>
              <div className="permissions-editor-intro">
                <strong>Permisos para coordinador superior</strong>
                <p>Activa solo los accesos avanzados que este usuario necesita fuera del alcance normal de un coordinador.</p>
              </div>

              <div className="permissions-editor-grid">
                {PERMISSION_CONFIGS.map((permission) => {
                  const isEnabled = Boolean(permissionsForm[permission.key])
                  const zoneKey = permission.zoneKey
                  const zoneIds = zoneKey && Array.isArray(permissionsForm[zoneKey]) ? permissionsForm[zoneKey] as number[] : []
                  return (
                    <div className="permission-switch-row permission-zone-row" key={String(permission.key)}>
                      <div className="permission-switch-copy">
                        <strong>{permission.title}</strong>
                        <p>{permission.description}</p>
                      </div>
                      <div className="permission-zone-picker">
                        {zoneKey ? (
                          <>
                            <button className="permission-zone-button" onClick={() => setOpenZonePicker(openZonePicker === String(permission.key) ? null : String(permission.key))} type="button">
                              Seleccionar zonas
                            </button>
                            <span className="permission-zone-summary">{getSelectedZoneNames(zoneIds, zones)}</span>
                            <div className={`permission-zone-dropdown ${openZonePicker === String(permission.key) ? 'active' : ''}`}>
                              {zones.length > 0 ? zones.map((zone) => (
                                <label className="permission-zone-option" key={zone.id}>
                                  <input checked={zone.id !== undefined && zoneIds.includes(Number(zone.id))} onChange={() => zone.id !== undefined && togglePermissionZone(zoneKey, Number(zone.id))} type="checkbox" />
                                  <span>{zone.name}</span>
                                </label>
                              )) : <div className="permission-zone-empty">No hay zonas disponibles.</div>}
                            </div>
                          </>
                        ) : null}
                        <label className="permission-switch">
                          <input checked={isEnabled} onChange={(event) => setPermissionsForm((current) => ({ ...current, [permission.key]: event.target.checked }))} type="checkbox" />
                          <span className="permission-switch-slider" />
                        </label>
                      </div>
                    </div>
                  )
                })}

                <div className="permission-switch-row permission-zone-row">
                  <div className="permission-switch-copy">
                    <strong>Ascender o descender rango</strong>
                    <p>Cambia desde aquí el rol del usuario entre empleado y coordinador.</p>
                  </div>
                  <div className="permission-zone-picker">
                    <select className="permission-inline-select" value={permissionsForm.role} onChange={(event) => setPermissionsForm((current) => ({ ...current, role: event.target.value as PermissionState['role'] }))}>
                      <option value="employee">Empleado</option>
                      <option value="coordinator">Coordinador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer-inline-actions" style={{ marginTop: '20px' }}>
                <button className="btn btn-secondary" onClick={handleCloseForm} type="button">Cancelar</button>
                <button className="btn btn-primary" disabled={permissionsMutation.isPending || !editingUser} onClick={() => permissionsMutation.mutate()} type="button">Guardar Permisos</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card employee-overview-shell">
        <div className="employee-overview-header">
          <div>
            <h2>👥 Vista de empleados</h2>
            <p>Resumen general con cliente actual, estado y próxima entrada.</p>
          </div>
          <div className="employee-overview-stats">
            <div className="employee-overview-stat"><strong>{users.length}</strong><span>Empleados</span></div>
            <div className="employee-overview-stat"><strong>{workingUsers}</strong><span>Activos</span></div>
            <div className="employee-overview-stat"><strong>{vacationUsers + inactiveUsers}</strong><span>Ausencias</span></div>
          </div>
        </div>

        <div className="employee-overview-toolbar">
          <input className="employee-overview-search" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por empleado, cliente o zona..." type="search" value={search} />
          <select className="employee-overview-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <div className="employee-overview-actions">
            {user?.role === 'admin' ? <button className="btn btn-primary" onClick={() => handleOpenForm(undefined, 'coordinator')} type="button">➕ Nuevo Coordinador</button> : null}
            <button className="btn btn-primary" onClick={() => handleOpenForm(undefined, 'employee')} type="button">➕ Nuevo Empleado</button>
          </div>
        </div>

        {usersQuery.isLoading ? <div className="loading">Cargando vista de empleados...</div> : null}

        {usersQuery.data ? (
          <div className="employee-overview-grid">
            {filteredUsers.map((listedUser) => {
              const dashboardEntry = dashboardById.get(Number(listedUser.id))
              const nextAssignment = dashboardEntry?.next_assignment
              const percentage = Number(dashboardEntry?.percentage ?? 0)
              return (
                <article className="employee-card-overview" key={listedUser.id}>
                  <div className="employee-card-overview-head">
                    <div className="employee-card-avatar" aria-hidden="true">{getInitials(listedUser.name)}</div>
                    <div className="employee-card-identity">
                      <h3>{listedUser.name}</h3>
                      <p>{listedUser.zone_name ?? 'Sin zona'}</p>
                    </div>
                    <div className="employee-card-menu-wrap">
                      <button className="employee-card-menu-btn" onClick={() => handleOpenForm(listedUser)} type="button">…</button>
                    </div>
                  </div>

                  <div className="employee-card-overview-meta">
                    <span className={`employee-status-badge ${dashboardEntry?.status_display_tone ? `tone-${dashboardEntry.status_display_tone}` : listedUser.active ? 'tone-success' : 'tone-danger'}`}>
                      {dashboardEntry?.status_display_label ?? (listedUser.active ? 'Usuario OK' : 'Usuario inactivo')}
                    </span>
                    <span className="employee-card-current-client">📞 Teléfono: {listedUser.phone ?? 'Sin teléfono'}</span>
                  </div>

                  <div className="client-overview-detail-list">
                    <div className="client-overview-detail">
                      <span>Cliente actual</span>
                      <strong>{dashboardEntry?.current_client_name ?? 'Ninguno'}</strong>
                    </div>
                  </div>

                  <div className="employee-card-metrics">
                    <div className="employee-card-metric">
                      <span className="employee-card-metric-label">Horas esta semana</span>
                      <strong>{formatHours(Number(dashboardEntry?.hours_worked_week ?? listedUser.weekly_hours ?? 0))}</strong>
                      <div className="employee-card-progress"><span data-width={percentage} style={{ width: `${percentage}%` }}></span></div>
                    </div>
                    <div className="employee-card-metric">
                      <span className="employee-card-metric-label">Próxima entrada</span>
                      <strong>{nextAssignment ? `${nextAssignment.start_time?.slice(0, 5) ?? '--:--'} · ${nextAssignment.client_name ?? 'Sin cliente'}` : 'Sin próxima entrada'}</strong>
                      <small>{dashboardEntry?.current_client_time ? `Último QR cliente: ${new Date(dashboardEntry.current_client_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : 'Último QR cliente: -:--'}</small>
                    </div>
                  </div>

                  <div className="employee-card-actions">
                    <button className="btn btn-secondary employee-card-action" onClick={() => navigate('/records')} type="button">Ver fichajes</button>
                    <button className="btn btn-secondary employee-card-action" onClick={() => navigate(`/quadrants?employeeName=${encodeURIComponent(listedUser.name)}`)} type="button">Ver cuadrante</button>
                    {canDeleteUsers ? <button className="btn btn-secondary employee-card-action" onClick={() => handleDelete(listedUser.id)} type="button">Eliminar</button> : null}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </div>
    </>
  )
}