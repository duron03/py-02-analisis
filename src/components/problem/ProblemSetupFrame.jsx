import { PRIORITIES } from '../../agent/AgentDecisionContract.js'
import { formatNumber } from '../../utils/formatters.js'
import SummaryCard from '../common/SummaryCard.jsx'

function isIntegerInput(value) {
  return (
    value !== '' &&
    value !== null &&
    value !== undefined &&
    /^\d+$/.test(String(value)) &&
    Number.isInteger(Number(value))
  )
}

function isIntegerInRange(value, min, max) {
  const numberValue = Number(value)
  return isIntegerInput(value) && numberValue >= min && numberValue <= max
}

function formatPendingNumber(value, isValid) {
  return isValid ? formatNumber(value) : 'Pendiente'
}

function getFieldHelpClass(isValid) {
  return isValid ? 'field-help' : 'field-help invalid'
}

function ProblemSetupFrame({
  capacity,
  itemCountInput,
  items,
  message,
  priority,
  timeLimitSeconds,
  totals,
  maxCapacity,
  maxItems,
  maxTimeLimitSeconds,
  minCapacity,
  minItems,
  minTimeLimitSeconds,
  onAskAgent,
  onBack,
  onCapacityChange,
  onGenerateRandomProblem,
  onItemBlur,
  onItemChange,
  onItemCountChange,
  onPriorityChange,
  onTimeLimitChange,
}) {
  const itemCountIsValid = isIntegerInRange(itemCountInput, minItems, maxItems)
  const capacityIsValid = isIntegerInRange(capacity, minCapacity, maxCapacity)
  const timeLimitIsValid = isIntegerInRange(
    timeLimitSeconds,
    minTimeLimitSeconds,
    maxTimeLimitSeconds,
  )
  const weightTotalIsReady = totals.weightIsComplete
  const valueTotalIsReady = totals.valueIsComplete
  const executionParamsAreValid = itemCountIsValid && capacityIsValid && timeLimitIsValid

  return (
    <main className="app-page knapsack-page">
      <header className="app-header">
        <div>
          <p className="eyebrow">Configuración del problema</p>
          <h1>Parámetros de ejecución</h1>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">
          Volver
        </button>
      </header>

      <section className="summary-strip" aria-label="Resumen del problema">
        <SummaryCard
          featured
          label="Objetos"
          value={itemCountIsValid ? formatNumber(Number(itemCountInput)) : 'Pendiente'}
        />
        <SummaryCard
          label="Capacidad W"
          value={formatPendingNumber(Number(capacity), capacityIsValid)}
        />
        <SummaryCard
          label="Peso total disponible"
          value={formatPendingNumber(totals.weight, weightTotalIsReady)}
        />
        <SummaryCard
          label="Valor total disponible"
          value={formatPendingNumber(totals.value, valueTotalIsReady)}
        />
      </section>

      <section className="problem-section" aria-labelledby="configuracion-problema">
        <div className="section-heading">
          <h2 id="configuracion-problema">Entrada del problema</h2>
          <div className="section-actions">
            <button
              className="secondary-button compact-button"
              onClick={onGenerateRandomProblem}
              type="button"
            >
              Generar objetos
            </button>
            <button
              className="primary-button compact-button"
              disabled={!executionParamsAreValid}
              onClick={onAskAgent}
              type="button"
            >
              Consultar agente
            </button>
          </div>
        </div>

        {message.texto ? (
          <p className={`form-message ${message.tipo}`}>{message.texto}</p>
        ) : null}

        <div className="problem-grid">
          <section className="problem-panel">
            <form className="problem-form">
              <label className="field">
                <span>Cantidad de objetos</span>
                <input
                  className={itemCountIsValid ? '' : 'invalid-input'}
                  inputMode="numeric"
                  onChange={onItemCountChange}
                  pattern="[0-9]*"
                  type="text"
                  value={itemCountInput}
                />
                <small className={getFieldHelpClass(itemCountIsValid)}>
                  Ingrese un entero entre {minItems} y {maxItems}.
                </small>
              </label>

              <label className="field">
                <span>Capacidad máxima W</span>
                <input
                  className={capacityIsValid ? '' : 'invalid-input'}
                  inputMode="numeric"
                  onChange={onCapacityChange}
                  pattern="[0-9]*"
                  type="text"
                  value={capacity}
                />
                <small className={getFieldHelpClass(capacityIsValid)}>
                  Ingrese un entero entre {minCapacity} y {maxCapacity}.
                </small>
              </label>

              <label className="field">
                <span>Tiempo límite tolerable (segundos)</span>
                <input
                  className={timeLimitIsValid ? '' : 'invalid-input'}
                  inputMode="numeric"
                  onChange={onTimeLimitChange}
                  pattern="[0-9]*"
                  type="text"
                  value={timeLimitSeconds}
                />
                <small className={getFieldHelpClass(timeLimitIsValid)}>
                  Ingrese un entero entre {minTimeLimitSeconds} y {maxTimeLimitSeconds} segundos.
                </small>
              </label>

              <div className="field-group">
                <span className="field-label">Prioridad del usuario</span>
                <div className="priority-controls priority-options">
                  <button
                    className={
                      priority === PRIORITIES.ACCURACY ? 'priority-button active' : 'priority-button'
                    }
                    onClick={() => onPriorityChange(PRIORITIES.ACCURACY)}
                    type="button"
                  >
                    Máxima exactitud
                  </button>
                  <button
                    className={priority === PRIORITIES.SPEED ? 'priority-button active' : 'priority-button'}
                    onClick={() => onPriorityChange(PRIORITIES.SPEED)}
                    type="button"
                  >
                    Velocidad máxima
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="problem-panel table-panel">
            <div className="section-heading table-heading">
              <h2>Objetos</h2>
              <span>{items.length} registro(s)</span>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Objeto</th>
                    <th>Peso</th>
                    <th>Valor</th>
                    <th>Densidad</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const hasValidWeight = isIntegerInput(item.weight) && Number(item.weight) > 0
                    const hasValidValue = isIntegerInput(item.value) && Number(item.value) >= 0
                    const density =
                      hasValidWeight && hasValidValue
                        ? (Number(item.value) / Number(item.weight)).toFixed(2)
                        : 'Pendiente'

                    return (
                      <tr key={item.id}>
                        <td>
                          <input
                            aria-label={`Nombre del objeto ${index + 1}`}
                            onChange={(event) => onItemChange(index, 'name', event.target.value)}
                            type="text"
                            value={item.name}
                          />
                        </td>
                        <td>
                          <input
                            aria-label={`Peso del objeto ${index + 1}`}
                            min="1"
                            onBlur={() => onItemBlur(index, 'weight')}
                            onChange={(event) => onItemChange(index, 'weight', event.target.value)}
                            type="number"
                            value={item.weight}
                          />
                        </td>
                        <td>
                          <input
                            aria-label={`Valor del objeto ${index + 1}`}
                            min="0"
                            onBlur={() => onItemBlur(index, 'value')}
                            onChange={(event) => onItemChange(index, 'value', event.target.value)}
                            type="number"
                            value={item.value}
                          />
                        </td>
                        <td>
                          <span className="density-value">{density}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default ProblemSetupFrame
