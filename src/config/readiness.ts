export type ReadinessItem = {
  id: string
  title: string
  status: 'done' | 'pending'
  detail: string
}

export type ReadinessSection = {
  title: string
  items: ReadinessItem[]
}

export const readinessChecklist: ReadinessSection[] = [
  {
    title: 'Contrato y superficie API',
    items: [
      {
        id: 'api-base',
        title: 'Base URL estable en /api',
        status: 'done',
        detail: 'El backend ya expone una base consistente para el cliente externo.',
      },
      {
        id: 'health',
        title: 'Health endpoint publico',
        status: 'done',
        detail: 'Existe un endpoint de salud para disponibilidad basica.',
      },
      {
        id: 'capabilities',
        title: 'Capabilities por rol para guards y navegacion',
        status: 'done',
        detail: 'El frontend puede construir menus y permisos sin inferir reglas legacy.',
      },
      {
        id: 'openapi',
        title: 'OpenAPI utilizable para tipos y cliente',
        status: 'done',
        detail: 'La spec cubre autenticacion y los recursos principales ya portados.',
      },
      {
        id: 'legacy-contract',
        title: 'Alias .php fuera del contrato del nuevo frontend',
        status: 'done',
        detail: 'React no necesita depender de rutas legacy ni del index.html antiguo.',
      },
    ],
  },
  {
    title: 'Operacion backend',
    items: [
      {
        id: 'scheduler',
        title: 'Scheduler legacy portado',
        status: 'done',
        detail: 'El chequeo de fichajes faltantes ya vive en el scheduler de Laravel.',
      },
      {
        id: 'cors',
        title: 'CORS explicito para React local',
        status: 'done',
        detail: 'El backend ya contempla localhost:3000 y localhost:5173.',
      },
      {
        id: 'health-db',
        title: 'Healthcheck con dependencia real de base de datos',
        status: 'pending',
        detail: 'El health actual responde disponibilidad estatica, no detecta una caida de MySQL.',
      },
      {
        id: 'login-throttle',
        title: 'Rate limiting de login',
        status: 'pending',
        detail: 'Antes de produccion conviene limitar intentos de autenticacion.',
      },
      {
        id: 'token-revocation',
        title: 'Revocacion real de tokens en logout',
        status: 'pending',
        detail: 'El logout actual invalida sesion solo del lado cliente.',
      },
      {
        id: 'observability',
        title: 'Observabilidad de scheduler y errores',
        status: 'pending',
        detail: 'Faltan checks operativos claros para cron, logs y alertas de produccion.',
      },
    ],
  },
  {
    title: 'Integracion frontend',
    items: [
      {
        id: 'react-template',
        title: 'Plantilla React en proyecto separado',
        status: 'done',
        detail: 'El frontend ya puede vivir desacoplado del backend y del legacy.',
      },
      {
        id: 'typed-client',
        title: 'Cliente tipado generado desde OpenAPI',
        status: 'done',
        detail: 'La plantilla incorpora generacion de tipos y cliente base con openapi-fetch.',
      },
      {
        id: 'auth-flow',
        title: 'Sesion restaurable con me y capabilities',
        status: 'done',
        detail: 'El cliente puede reconstruir estado de autenticacion sin acoplarse al legacy.',
      },
      {
        id: 'smoke-e2e',
        title: 'Smoke test real frontend-backend',
        status: 'pending',
        detail: 'Sigue faltando una prueba externa completa contra el backend levantado.',
      },
      {
        id: 'seed-data',
        title: 'Dataset minimo por rol para desarrollo',
        status: 'pending',
        detail: 'Conviene fijar usuarios y datos base para no depender del estado manual de la BD.',
      },
    ],
  },
]
