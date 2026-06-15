import { validateAgentDecision } from '../agent/AgentDecisionContract.js'
import { AgentPromptBuilder } from '../agent/AgentPromptBuilder.js'

/**
 * Servicio real que usa la API de Gemini (Google AI Studio) para decidir
 * qué algoritmo usar. Reemplaza AgentDecisionMockService.
 */
export class AgentDecisionService {
  /**
   * @param {string} apiKey - API key de Google AI Studio. No la dejes en el repo.
   * @param {string} [model] - Modelo de Gemini a usar. Por defecto gemini-2.0-flash.
   */
  constructor(apiKey, model = 'gemini-2.5-flash') {
    if (!apiKey) {
      throw new Error('Se necesita una API key de Google AI Studio.')
    }
    this.apiKey = apiKey
    this.model = model
    this.promptBuilder = new AgentPromptBuilder()
  }

  /**
   * Llama a Gemini y devuelve la decisión del algoritmo.
   *
   * @param {{ problem: object, constraints: { priority: string, timeLimitSeconds: number } }} request
   * @returns {Promise<object>}
   */
  async decide(request) {
    const systemPrompt = this.promptBuilder.buildSystemPrompt()
    const userPrompt = this.promptBuilder.buildUserPrompt(request)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    const body = {
      
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,     
        maxOutputTokens: 512,
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Error de la API de Gemini (${response.status}): ${error}`)
    }

    const data = await response.json()

    // La respuesta de Gemini viene en candidates[0].content.parts[0].text
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      throw new Error('El API de Gemini devolvió una respuesta vacía o inesperada.')
    }

    const decision = this._parseDecision(rawText)

    const validation = validateAgentDecision(decision)
    if (!validation.isValid) {
      throw new Error(`Respuesta inválida del agente: ${validation.errors.join(', ')}`)
    }

    return decision
  }

  /**
   * Parsea el JSON que devuelve Gemini.
   * Con responseMimeType: 'application/json' ya debería venir limpio,
   * pero toleramos bloques ```json por si acaso.
   *
   * @param {string} text
   * @returns {object}
   */
  _parseDecision(text) {
    const clean = text.replace(/```json|```/g, '').trim()

    try {
      return JSON.parse(clean)
    } catch {
      throw new Error(`Gemini no devolvió JSON válido. Respuesta recibida:\n${text}`)
    }
  }
}