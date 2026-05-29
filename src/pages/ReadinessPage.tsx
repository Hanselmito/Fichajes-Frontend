import { readinessChecklist } from '../config/readiness'

export function ReadinessPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Checklist exacto</span>
          <h1 className="page-title">Backend ready for React</h1>
          <p className="page-subtitle">
            Estado actual del backend pensando en integracion real con este cliente React.
          </p>
        </div>
      </header>

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
