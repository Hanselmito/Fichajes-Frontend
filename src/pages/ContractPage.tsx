import { getApiBaseUrl } from '../api/config'

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
      <header className="page-header">
        <div>
          <span className="eyebrow">Contrato</span>
          <h1 className="page-title">Consumo del backend</h1>
          <p className="page-subtitle">
            La plantilla ya queda alineada con el contrato Laravel: bearer token, `success` como
            semaforo funcional y tipos generados desde OpenAPI.
          </p>
        </div>
      </header>

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
