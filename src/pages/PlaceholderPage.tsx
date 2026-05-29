import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function PlaceholderPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const { capabilities } = useAuth()
  const resourceAccess = sectionId ? capabilities?.resource_access?.[sectionId] : null

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Plantilla inicial</span>
          <h1 className="page-title">{sectionId ?? 'Seccion'}</h1>
          <p className="page-subtitle">
            Ruta reservada para seguir montando la UI real del modulo sin volver a tocar la base de
            auth, contrato ni cliente OpenAPI.
          </p>
        </div>
      </header>

      <section className="section-grid">
        <article className="section-card">
          <strong>Visible</strong>
          <span className={`check-pill ${resourceAccess?.visible ? 'done' : 'pending'}`}>
            {resourceAccess?.visible ? 'Si' : 'No'}
          </span>
        </article>
        <article className="section-card">
          <strong>Gestion</strong>
          <span className={`check-pill ${resourceAccess?.manage ? 'done' : 'pending'}`}>
            {resourceAccess?.manage ? 'Si' : 'No'}
          </span>
        </article>
        <article className="section-card">
          <strong>Scope de zona</strong>
          <p className="panel-copy">
            {resourceAccess?.zone_scope === null
              ? 'Sin limite efectivo'
              : resourceAccess?.zone_scope?.join(', ') || 'Sin scope transversal'}
          </p>
        </article>
      </section>
    </>
  )
}