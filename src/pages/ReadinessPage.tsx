import { readinessChecklist } from '../config/readiness'
import { PageHeader } from '../components/PageHeader'

export function ReadinessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Checklist exacto"
        subtitle="Estado actual del backend pensando en integracion real con este cliente React."
        title="Backend ready for React"
      />

      {readinessChecklist.map((section) => (
        <section className="table-card" key={section.title}>
          <strong>{section.title}</strong>
          <div className="checklist-grid">
            {section.items.map((item) => (
              <article className="section-card" key={item.id}>
                <span className={`check-pill ${item.status}`}>
                  {item.status === 'done' ? 'Cumplido' : 'Pendiente'}
                </span>
                <strong>{item.title}</strong>
                <p className="panel-copy">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
