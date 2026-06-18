/**
 * Construye los mensajes que recibe el agente externo.
 */
export class AgentPromptBuilder {
  /**
   * @returns {string}
   */
  buildSystemPrompt() {
    return [
      'Eres un agente especializado en seleccionar algoritmos para el problema de la mochila 0/1.',
      'Tu tarea es escoger el algoritmo local mas conveniente segun los datos del problema.',
      'Algoritmos disponibles: backtracking, dynamic-programming, greedy.',
      '',
      'backtracking: exacto, O(2^N). Conviene solo con N pequeno.',
      'dynamic-programming: exacto, O(N * W). Conviene cuando W es manejable.',
      'greedy: aproximado por densidad valor/peso, O(N log N). Conviene para velocidad.',
      '',
      'Reglas generales:',
      '- Si la prioridad es speed, favorece greedy.',
      '- Si la prioridad es accuracy y N es pequeno, puedes usar backtracking.',
      '- Si la prioridad es accuracy y W es razonable, puedes usar dynamic-programming.',
      '- Evita backtracking cuando N sea grande.',
      '- Evita dynamic-programming cuando W haga muy costosa la tabla.',
      '',
      'Para estimar operaciones usa estas referencias:',
      '- backtracking: operaciones = 2^N, tiempo = max(1, round(2^N / 1000))',
      '- dynamic-programming: operaciones = N * W, tiempo = max(1, round((N * W) / 1000))',
      '- greedy: operaciones = N * log2(N), tiempo = 1',
      '',
      'Responde unicamente con JSON valido y sin texto adicional.',
      'selectedAlgorithm solo puede ser "backtracking", "dynamic-programming" o "greedy".',
      'La razon debe estar escrita en espanol.',
      'Formato esperado:',
      '{',
      '  "selectedAlgorithm": "dynamic-programming",',
      '  "estimatedTimeMs": 0,',
      '  "estimatedOperations": 0,',
      '  "confidence": 0.0,',
      '  "reason": "explicacion breve"',
      '}',
    ].join(' ')
  }

  /**
   * @returns {string}
   */
  buildResultSystemPrompt() {
    return [
      'Eres un agente que explica resultados de una ejecucion local del problema de la mochila 0/1.',
      'Recibiras la decision inicial del agente, la solucion local y la comparacion entre estimaciones y mediciones reales.',
      'Si localSolution.wasInterrupted es true, explica que la solucion es parcial porque se alcanzo el tiempo limite tolerable.',
      'Explica si la estimacion fue razonable, que tipo de solucion se obtuvo y que recomendacion queda para otro intento.',
      'Responde unicamente con JSON valido y sin texto adicional.',
      'Formato exacto:',
      '{',
      '  "summary": "resumen del resultado",',
      '  "estimateComparison": "comparacion entre estimado y real",',
      '  "resultQuality": "comentario sobre optimalidad o heuristica",',
      '  "recommendation": "siguiente recomendacion practica"',
      '}',
    ].join(' ')
  }

  /**
   * @param {object} agentRequest
   * @returns {string}
   */
  buildUserPrompt(agentRequest) {
    const { problem, constraints } = agentRequest
    const itemCount = problem.items?.length || 0
    const capacity = problem.capacity || 0

    return [
      `N: ${itemCount}`,
      `W: ${capacity}`,
      `Prioridad: ${constraints.priority}`,
      `Tiempo limite en segundos: ${constraints.timeLimitSeconds}`,
      '',
      'Datos completos en JSON:',
      JSON.stringify(agentRequest, null, 2),
    ].join('\n')
  }

  /**
   * @param {object} resultRequest
   * @returns {string}
   */
  buildResultPrompt(resultRequest) {
    return [
      'Resultado completo de la ejecucion local:',
      JSON.stringify(resultRequest, null, 2),
    ].join('\n')
  }
}
