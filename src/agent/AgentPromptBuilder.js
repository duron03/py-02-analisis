/**
 * Construye instrucciones para el agente real que se conectara despues.
 */
export class AgentPromptBuilder {
  /**
   * @returns {string}
   */
  buildSystemPrompt() {
    return [
      'Eres un agente que selecciona algoritmos para el problema de la mochila 0/1.',
      'Debes responder solo JSON valido.',
      'Algoritmos disponibles: backtracking, dynamic-programming, greedy.',
      'Backtracking es exacto, pero O(2^n).',
      'Programacion dinamica es exacta, pero O(N * W) en tiempo y memoria.',
      'Greedy por densidad es rapido O(N log N), pero no garantiza optimalidad.',
    ].join(' ')
  }

  /**
   * @param {object} agentRequest
   * @returns {string}
   */
  buildUserPrompt(agentRequest) {
    return JSON.stringify(agentRequest, null, 2)
  }
}

