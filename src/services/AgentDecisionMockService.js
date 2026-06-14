import { PRIORITIES } from '../agent/AgentDecisionContract.js'

/**
 * Servicio temporal que simula la decision de un agente de IA.
 */
export class AgentDecisionMockService {
  /**
   * Selecciona un algoritmo con reglas simples mientras se integra la API real.
   *
   * @param {{ problem: object, constraints: { priority: string, timeLimitSeconds: number } }} request
   * @returns {Promise<object>}
   */
  async decide(request) {
    const itemCount = request.problem.items.length
    const capacity = request.problem.capacity
    const priority = request.constraints.priority
    let selectedAlgorithm
    let reason

    if (priority === PRIORITIES.SPEED) {
      selectedAlgorithm = 'greedy'
      reason = 'Se elige Greedy porque el usuario prioriza velocidad.'
    } else if (itemCount <= 12) {
      selectedAlgorithm = 'backtracking'
      reason = 'Se elige Backtracking porque N es pequeno y se busca exactitud.'
    } else if (capacity <= 2000) {
      selectedAlgorithm = 'dynamic-programming'
      reason = 'Se elige Programacion Dinamica porque W es moderado y se busca exactitud.'
    } else {
      selectedAlgorithm = 'greedy'
      reason = 'Se evita Programacion Dinamica por W grande y Backtracking por N grande.'
    }

    return {
      selectedAlgorithm,
      estimatedTimeMs: this.estimateTimeMs(itemCount, capacity, selectedAlgorithm),
      estimatedOperations: this.estimateOperations(itemCount, capacity, selectedAlgorithm),
      confidence: 0.75,
      reason,
    }
  }

  /**
   * @param {number} itemCount
   * @param {number} capacity
   * @param {string} algorithmId
   * @returns {number}
   */
  estimateOperations(itemCount, capacity, algorithmId) {
    if (algorithmId === 'backtracking') {
      return 2 ** itemCount
    }

    if (algorithmId === 'dynamic-programming') {
      return itemCount * capacity
    }

    return Math.ceil(itemCount * Math.log2(Math.max(itemCount, 2)))
  }

  /**
   * @param {number} itemCount
   * @param {number} capacity
   * @param {string} algorithmId
   * @returns {number}
   */
  estimateTimeMs(itemCount, capacity, algorithmId) {
    const operations = this.estimateOperations(itemCount, capacity, algorithmId)
    return Math.max(1, Math.round(operations / 1000))
  }
}
