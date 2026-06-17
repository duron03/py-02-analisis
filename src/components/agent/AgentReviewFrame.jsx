import { formatAlgorithmName, formatMilliseconds, formatNumber, formatPriority } from '../../utils/formatters.js'
import MetricRow from '../common/MetricRow.jsx'
import SummaryCard from '../common/SummaryCard.jsx'

function AgentReviewFrame({
  agentDecision,
  capacity,
  items,
  priority,
  selectedAlgorithm,
  timeLimitSeconds,
  totals,
  onBack,
  onConfirmExecution,
}) {
  const algorithmId = agentDecision?.selectedAlgorithm || selectedAlgorithm

  return (
    <main className="app-page review-page">
      <header className="app-header">
        <div>
          <p className="eyebrow">Decisión del agente</p>
          <h1>Confirmar ejecución local</h1>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">
          Editar parámetros
        </button>
      </header>

      <section className="summary-strip" aria-label="Resumen de decision">
        <SummaryCard featured label="Algoritmo" value={formatAlgorithmName(algorithmId)} />
        <SummaryCard
          label="Tiempo estimado"
          value={agentDecision ? formatMilliseconds(agentDecision.estimatedTimeMs) : 'Pendiente'}
        />
        <SummaryCard
          label="Operaciones estimadas"
          value={agentDecision ? formatNumber(agentDecision.estimatedOperations) : 'Pendiente'}
        />
        <SummaryCard
          label="Confianza"
          value={agentDecision ? `${(agentDecision.confidence * 100).toFixed(0)}%` : 'Pendiente'}
        />
      </section>

      <section className="app-grid">
        <article className="app-card decision-card">
          <div className="recommendation-heading">
            <div>
              <strong>{formatAlgorithmName(algorithmId)}</strong>
              <span>{formatPriority(priority)} · límite {timeLimitSeconds}s</span>
            </div>
            <span className="status info">Recomendado</span>
          </div>
          <p>{agentDecision?.reason}</p>
          <div className="decision-actions">
            <button className="secondary-button" onClick={onBack} type="button">
              Cambiar datos
            </button>
            <button className="primary-button" onClick={onConfirmExecution} type="button">
              Aceptar y ejecutar
            </button>
          </div>
        </article>

        <article className="app-card">
          <p className="eyebrow">Problema actual</p>
          <MetricRow label="Objetos" value={items.length} />
          <MetricRow label="Capacidad" value={formatNumber(capacity)} />
          <MetricRow label="Peso total disponible" value={formatNumber(totals.weight)} />
        </article>
      </section>
    </main>
  )
}

export default AgentReviewFrame
