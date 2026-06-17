import { formatPriority } from '../../utils/formatters.js'
import MetricRow from '../common/MetricRow.jsx'
import SummaryCard from '../common/SummaryCard.jsx'

function WelcomeFrame({
  algorithms,
  priority,
  runCounter,
  onLogout,
  onStartAttempt,
}) {
  return (
    <main className="app-page welcome-page">
      <header className="app-header welcome-header">
        <div className="welcome-title">
          <p className="eyebrow">Knapsack Smart Router</p>
          <h1>¡Bienvenido(a)!</h1>
        </div>
        <div className="header-actions welcome-actions">
          <button className="secondary-button" onClick={onLogout} type="button">
            Cerrar sesión
          </button>
          <button className="primary-button" onClick={onStartAttempt} type="button">
            Nuevo análisis
          </button>
        </div>
      </header>

      <section className="summary-strip welcome-summary" aria-label="Resumen del sistema">
        <SummaryCard featured label="Algoritmos locales" value="3" />
        <SummaryCard label="Modo exacto" value="BT / PD" />
        <SummaryCard label="Modo rápido" value="Greedy" />
        <SummaryCard label="Intentos ejecutados" value={runCounter} />
      </section>

      <section className="app-grid welcome-grid">
        <article className="app-card strategy-list">
          <p className="eyebrow">Estrategias disponibles</p>
          {algorithms.map((algorithm) => (
            <MetricRow
              key={algorithm.id}
              label={algorithm.name}
              value={algorithm.complexity.time}
            />
          ))}
        </article>

        <article className="app-card strategy-list">
          <p className="eyebrow">Sesión</p>
          <MetricRow label="Prioridad inicial" value={formatPriority(priority)} />
          <MetricRow label="Intentos ejecutados" value={runCounter} />
          <MetricRow label="Estado" value="Activo" />
        </article>
      </section>
    </main>
  )
}

export default WelcomeFrame
