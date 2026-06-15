/**
 * Construye los prompts que recibe el agente real de Gemini.
 */
export class AgentPromptBuilder {
  /**
   * Instrucciones del sistema — van en systemInstruction de la API de Gemini.
   *
   * @returns {string}
   */
  buildSystemPrompt() {
    return [
      'Eres un agente experto en algoritmos para el problema de la mochila 0/1.',
      'Tu única tarea es seleccionar el algoritmo más adecuado para un problema dado.',
      '',
      'Algoritmos disponibles:',
      '- backtracking: solución exacta. Complejidad O(2^N). Solo viable con N <= 15 aproximadamente.',
      '- dynamic-programming: solución exacta. Complejidad O(N * W). Viable cuando W <= 5000.',
      '- greedy: solución aproximada por densidad (valor/peso). Complejidad O(N log N). Siempre rápido, no garantiza optimalidad.',
      '',
      'Reglas de decisión:',
      '- priority = "speed": siempre usar greedy.',
      '- priority = "accuracy" y N <= 15: preferir backtracking.',
      '- priority = "accuracy" y N > 15 y W <= 5000: preferir dynamic-programming.',
      '- priority = "accuracy" y N > 15 y W > 5000: usar greedy (evitar memoria excesiva).',
      '',
      'Para estimatedTimeMs y estimatedOperations usa estas fórmulas:',
      '- backtracking: operaciones = 2^N, tiempo = max(1, round(2^N / 1000))',
      '- dynamic-programming: operaciones = N * W, tiempo = max(1, round(N * W / 1000))',
      '- greedy: operaciones = N * log2(N), tiempo = 1',
      '',
      'Responde ÚNICAMENTE con un objeto JSON válido con esta forma exacta:',
      '{',
      '  "selectedAlgorithm": "backtracking" | "dynamic-programming" | "greedy",',
      '  "estimatedTimeMs": <entero>,',
      '  "estimatedOperations": <entero>,',
      '  "confidence": <número entre 0.0 y 1.0>,',
      '  "reason": "<una o dos oraciones explicando la decisión>"',
      '}',
      '',
      'No incluyas texto fuera del JSON.',
    ].join('\n')
  }

  /**
   * Mensaje del usuario — va en contents[0].parts[0].text de la API de Gemini.
   *
   * @param {object} agentRequest - Creado con createAgentRequest()
   * @returns {string}
   */
  buildUserPrompt(agentRequest) {
    const { problem, constraints } = agentRequest
    const N = problem.items?.length ?? 0
    const W = problem.capacity ?? 0

    return [
      `Número de objetos (N): ${N}`,
      `Capacidad de la mochila (W): ${W}`,
      `Prioridad del usuario: ${constraints.priority}`,
      `Tiempo límite: ${constraints.timeLimitSeconds} segundos`,
      '',
      'Datos completos:',
      JSON.stringify(agentRequest, null, 2),
    ].join('\n')
  }
}
