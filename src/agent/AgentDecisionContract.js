export const PRIORITIES = {
  ACCURACY: 'accuracy',
  SPEED: 'speed',
}

export const AVAILABLE_ALGORITHMS = [
  'backtracking',
  'dynamic-programming',
  'greedy',
]

export const AGENT_DECISION_RESPONSE_FORMAT = {
  selectedAlgorithm: AVAILABLE_ALGORITHMS,
  estimatedTimeMs: 'number',
  estimatedOperations: 'number',
  confidence: 'number between 0 and 1',
  reason: 'string',
}

export const AGENT_RESULT_RESPONSE_FORMAT = {
  summary: 'string',
  estimateComparison: 'string',
  resultQuality: 'string',
  recommendation: 'string',
}

/**
 * Crea el objeto que recibe el agente para escoger un algoritmo.
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
    expectedResponse: AGENT_DECISION_RESPONSE_FORMAT,
  }
}

/**
 * Crea el objeto que recibe el agente para explicar la ejecucion final.
 *
 * @param {{ problem: object, constraints: object, decision: object, solution: object, comparison: object }} data
 * @returns {object}
 */
export function createAgentResultRequest(data) {
  return {
    problem: data.problem,
    constraints: data.constraints,
    agentDecision: data.decision,
    localSolution: data.solution,
    comparison: data.comparison,
    expectedResponse: AGENT_RESULT_RESPONSE_FORMAT,
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

  if (!decision || typeof decision !== 'object') {
    return {
      isValid: false,
      errors: ['La respuesta del agente debe ser un objeto JSON.'],
    }
  }

  if (!AVAILABLE_ALGORITHMS.includes(decision.selectedAlgorithm)) {
    errors.push('El algoritmo seleccionado no existe.')
  }

  if (!Number.isFinite(decision.estimatedTimeMs) || decision.estimatedTimeMs < 0) {
    errors.push('El tiempo estimado debe ser un numero mayor o igual a cero.')
  }

  if (!Number.isFinite(decision.estimatedOperations) || decision.estimatedOperations < 0) {
    errors.push('Las operaciones estimadas deben ser un numero mayor o igual a cero.')
  }

  if (typeof decision.reason !== 'string' || decision.reason.trim().length === 0) {
    errors.push('La decision debe incluir una justificacion.')
  }

  if (!Number.isFinite(decision.confidence) || decision.confidence < 0 || decision.confidence > 1) {
    errors.push('La confianza debe ser numerica y estar entre 0 y 1.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Valida la explicacion final generada por el agente.
 *
 * @param {object} explanation
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateAgentResultExplanation(explanation) {
  const errors = []

  if (!explanation || typeof explanation !== 'object') {
    return {
      isValid: false,
      errors: ['La explicacion del agente debe ser un objeto JSON.'],
    }
  }

  Object.keys(AGENT_RESULT_RESPONSE_FORMAT).forEach((fieldName) => {
    if (typeof explanation[fieldName] !== 'string' || explanation[fieldName].trim().length === 0) {
      errors.push(`La explicacion debe incluir el campo ${fieldName}.`)
    }
  })

  if (typeof explanation.summary === 'string' && explanation.summary.length > 500) {
    errors.push('El resumen del agente es demasiado largo.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
