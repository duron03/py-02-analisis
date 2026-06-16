import { formatMilliseconds, formatNumber } from '../../utils/formatters.js'
import MetricRow from '../common/MetricRow.jsx'
import SummaryCard from '../common/SummaryCard.jsx'

function ResultsFrame({
  agentDecision,
  agentResultExplanation,
  capacity,
  executionRequest,
  items,
  maxItemValue,
  message,
  selectedAlgorithmInfo,
  selectedItemIds,
  solution,
  onAdjustProblem,
  onNewAttempt,
}) {
  const estimatedTime = agentDecision?.estimatedTimeMs
  const estimatedOperations = agentDecision?.estimatedOperations
  const realTime = solution?.executionTimeMs || 0
  const realOperations = solution?.operationCount || 0
  const timeDifference = estimatedTime !== undefined ? realTime - estimatedTime : null
  const timeMax = Math.max(Number(estimatedTime || 0), realTime, 1)
  const operationsMax = Math.max(Number(estimatedOperations || 0), realOperations, 1)
  const estimatedTimeWidth = `${Math.max(4, (Number(estimatedTime || 0) / timeMax) * 100)}%`
  const realTimeWidth = `${Math.max(4, (realTime / timeMax) * 100)}%`
  const estimatedOperationsWidth = `${Math.max(4, (Number(estimatedOperations || 0) / operationsMax) * 100)}%`
  const realOperationsWidth = `${Math.max(4, (realOperations / operationsMax) * 100)}%`
  const explanationOutput = agentResultExplanation
    ? JSON.stringify(agentResultExplanation, null, 2)
    : null

  return (
    <main className="app-page knapsack-page">
      <header className="app-header">
        <div>
          <p className="eyebrow">Resultado final</p>
          <h1>Comparación de ejecución</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={onAdjustProblem} type="button">
            Ajustar problema
          </button>
          <button className="primary-button" onClick={onNewAttempt} type="button">
            Nuevo intento
          </button>
        </div>
      </header>

      {message.texto ? (
        <p className={`form-message ${message.tipo}`}>{message.texto}</p>
      ) : null}

      <section className="summary-strip" aria-label="Resumen de solucion">
        <SummaryCard featured label="Valor obtenido" value={formatNumber(solution?.totalValue || 0)} />
        <SummaryCard
          label="Peso usado"
          value={`${formatNumber(solution?.totalWeight || 0)} / ${formatNumber(capacity)}`}
        />
        <SummaryCard
          label="Tiempo real"
          value={solution ? formatMilliseconds(solution.executionTimeMs) : 'Pendiente'}
        />
        <SummaryCard
          label="Tipo de solución"
          value={solution?.isOptimal ? 'Óptima' : 'Heurística'}
        />
      </section>

      <section className="app-grid results-grid" aria-label="Resultados y métricas">
        <section className="app-section">
          <div className="section-heading">
            <h2>Objetos seleccionados</h2>
            <span>{solution?.algorithmName}</span>
          </div>

          <article className="app-card solution-card">
            <div className="solution-main">
              <div>
                <span>Valor total</span>
                <strong>{formatNumber(solution?.totalValue || 0)}</strong>
              </div>
              <div>
                <span>Peso total</span>
                <strong>{formatNumber(solution?.totalWeight || 0)}</strong>
              </div>
              <div>
                <span>Seleccionados</span>
                <strong>{solution?.selectedItems.length || 0}</strong>
              </div>
            </div>

            <div className="selected-list">
              {solution?.selectedItems.length ? (
                solution.selectedItems.map((item) => (
                  <div className="selected-item" key={item.id}>
                    <strong>{item.name}</strong>
                    <span>
                      Peso {formatNumber(item.weight)} · Valor {formatNumber(item.value)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty-state">El algoritmo no seleccionó objetos.</p>
              )}
            </div>
          </article>

          <div className="section-heading">
            <h2>Visualización</h2>
            <span>Valor por objeto</span>
          </div>

          <article className="app-card chart-card">
            {items.map((item, index) => {
              const isSelected = selectedItemIds.has(index + 1)
              const barWidth = `${Math.max(6, (Number(item.value || 0) / maxItemValue) * 100)}%`

              return (
                <div className={isSelected ? 'chart-row selected' : 'chart-row'} key={item.id}>
                  <div className="chart-label">
                    <strong>{item.name}</strong>
                    <span>{formatNumber(item.value)} pts</span>
                  </div>
                  <div className="chart-track">
                    <span className="chart-fill" style={{ width: barWidth }} />
                  </div>
                </div>
              )
            })}
          </article>
        </section>

        <section className="app-section">
          <div className="section-heading">
            <h2>Estadísticas</h2>
            <span>{executionRequest?.mode === 'agent' ? 'Agente vs local' : 'Manual'}</span>
          </div>

          <article className="app-card metrics-card">
            <MetricRow label="Algoritmo ejecutado" value={solution?.algorithmName} />
            <MetricRow
              label="Tiempo estimado"
              value={estimatedTime !== undefined ? formatMilliseconds(estimatedTime) : 'Sin estimación'}
            />
            <MetricRow
              label="Tiempo real local"
              value={solution ? formatMilliseconds(solution.executionTimeMs) : 'Pendiente'}
            />
            <MetricRow
              label="Diferencia"
              value={timeDifference !== null ? formatMilliseconds(timeDifference) : 'Sin estimación'}
            />
            <MetricRow
              label="Operaciones estimadas"
              value={estimatedOperations !== undefined ? formatNumber(estimatedOperations) : 'Sin estimación'}
            />
            <MetricRow
              label="Operaciones reales"
              value={solution ? formatNumber(realOperations) : 'Pendiente'}
            />
            <MetricRow label="Complejidad temporal" value={selectedAlgorithmInfo?.complexity.time} />
            <MetricRow label="Complejidad espacial" value={selectedAlgorithmInfo?.complexity.space} />
          </article>

          <article className="app-card comparison-card">
            <p className="eyebrow">Comparación de rendimiento</p>

            <div className="comparison-block">
              <div className="comparison-heading">
                <strong>Tiempo de ejecución</strong>
                <span>milisegundos</span>
              </div>
              <div className="comparison-row">
                <span>Estimado IA</span>
                <div className="comparison-track">
                  <span className="comparison-fill estimate" style={{ width: estimatedTimeWidth }} />
                </div>
                <strong>{estimatedTime !== undefined ? formatMilliseconds(estimatedTime) : 'N/D'}</strong>
              </div>
              <div className="comparison-row">
                <span>Real local</span>
                <div className="comparison-track">
                  <span className="comparison-fill real" style={{ width: realTimeWidth }} />
                </div>
                <strong>{formatMilliseconds(realTime)}</strong>
              </div>
            </div>

            <div className="comparison-block">
              <div className="comparison-heading">
                <strong>Operaciones</strong>
                <span>estimadas / reales</span>
              </div>
              <div className="comparison-row">
                <span>Estimadas</span>
                <div className="comparison-track">
                  <span className="comparison-fill estimate" style={{ width: estimatedOperationsWidth }} />
                </div>
                <strong>{estimatedOperations !== undefined ? formatNumber(estimatedOperations) : 'N/D'}</strong>
              </div>
              <div className="comparison-row">
                <span>Reales</span>
                <div className="comparison-track">
                  <span className="comparison-fill real" style={{ width: realOperationsWidth }} />
                </div>
                <strong>{formatNumber(realOperations)}</strong>
              </div>
            </div>
          </article>

          <article className="app-card agent-analysis-card">
            <p className="eyebrow">Explicación del agente</p>

            {agentResultExplanation ? (
              <>
                <div className="analysis-list">
                  <div>
                    <strong>Resumen</strong>
                    <p>{agentResultExplanation.summary}</p>
                  </div>
                  <div>
                    <strong>Estimación contra ejecución</strong>
                    <p>{agentResultExplanation.estimateComparison}</p>
                  </div>
                  <div>
                    <strong>Calidad de la solución</strong>
                    <p>{agentResultExplanation.resultQuality}</p>
                  </div>
                  <div>
                    <strong>Recomendación</strong>
                    <p>{agentResultExplanation.recommendation}</p>
                  </div>
                </div>

                <pre className="json-output">{explanationOutput}</pre>
              </>
            ) : (
              <p className="empty-state">No se recibió explicación final del agente.</p>
            )}
          </article>
        </section>
      </section>
    </main>
  )
}

export default ResultsFrame
