import { PageHeader } from '../components/PageHeader'

export function ZoneHolidaysPage() {
  return (
    <>
      <PageHeader
        eyebrow="Festivos de Zona"
        subtitle="Administración de los días festivos específicos de cada zona."
        title="Festivos de Zona"
      />

      <section className="table-card resource-shell-card" style={{ marginTop: '2rem' }}>
        <div className="section-head-row">
          <div>
            <strong>Días Festivos (zone_holidays)</strong>
            <p className="table-note">Aquí podrás configurar los días no laborables para las distintas zonas.</p>
          </div>
          <button className="primary-button" type="button">
            + Añadir Festivo
          </button>
        </div>
        <div className="empty-state">
          <p>Módulo de festivos de zona en construcción.</p>
        </div>
      </section>
    </>
  )
}
