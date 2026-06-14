export const PRIORITIES = {
  ACCURACY: 'accuracy',
  SPEED: 'speed',
}

export const AVAILABLE_ALGORITHMS = [
  'backtracking',
  'dynamic-programming',
  'greedy',
]

/**
 * Crea el objeto que recibira el agente real en el futuro.
 *
 * @param {object} problem
 * @param {{ priority: string, timeLimitSeconds: number }} constraints
 * @returns {object}
 */
export function createAgentRequest(problem, constraints) {
  return {
    problem,
    constraints,
    availableAlgorithms: AVAILABLE_ALGORITHMS,
  }
}

/**
 * Valida la forma minima de una decision del agente.
 *
 * @param {object} decision
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateAgentDecision(decision) {
  const errors = []

  if (!AVAILABLE_ALGORITHMS.includes(decision.selectedAlgorithm)) {
    errors.push('El algoritmo seleccionado no existe.')
  }

  if (typeof decision.reason !== 'string' || decision.reason.trim().length === 0) {
    errors.push('La decision debe incluir una justificacion.')
  }

  if (typeof decision.confidence !== 'number') {
    errors.push('La confianza debe ser numerica.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

