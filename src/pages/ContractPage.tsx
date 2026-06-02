import { getApiBaseUrl } from '../api/config'
import { PageHeader } from '../components/PageHeader'

const keyEndpoints = [
  'POST /auth/login',
  'GET /auth/me',
  'GET /auth/capabilities',
  'GET /dashboard',
  'GET /records',
  'GET /quadrants',
  'GET /services',
  'GET /vacation-requests',
]

export function ContractPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contrato"
        subtitle="La plantilla queda alineada con el contrato Laravel: bearer token, success como semaforo funcional y tipos generados desde OpenAPI."
        title="Consumo del backend"
      />

      <section className="contract-grid">
        <article className="section-card">
          <strong>Base URL</strong>
          <code className="contract-code">{getApiBaseUrl()}</code>
        </article>
        <article className="section-card">
          <strong>OpenAPI fuente</strong>
          <code className="contract-code">../fichaje-backend/docs/openapi.yaml</code>
        </article>
        <article className="section-card">
          <strong>Estrategia de auth</strong>
          <p className="panel-copy">
            El token se guarda en localStorage y la sesion se reconstruye con `me` y
            `capabilities`.
          </p>
        </article>
      </section>

      <section className="table-card">
        <strong>Endpoints que ya usa esta base</strong>
        <div className="capability-grid">
          {keyEndpoints.map((endpoint) => (
            <code className="contract-code" key={endpoint}>
              {endpoint}
            </code>
          ))}
        </div>
      </section>
    </>
  )
}
