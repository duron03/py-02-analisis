import {
  AVAILABLE_ALGORITHMS,
  validateAgentDecision,
  validateAgentResultExplanation,
} from '../agent/AgentDecisionContract.js'
import { AgentPromptBuilder } from '../agent/AgentPromptBuilder.js'

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

/**
 * Conecta la GUI con el agente externo.
 *
 * La API key se recibe en tiempo de ejecucion y solo se mantiene en memoria
 * mientras existe esta instancia del servicio.
 */
export class AgentDecisionService {
  /**
   * @param {string} apiKey
   * @param {string} [model]
   */
  constructor(apiKey, model = 'gemini-2.5-flash') {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('Ingrese una API key válida para consultar el agente.')
    }

    this.apiKey = apiKey.trim()
    this.models = [model, ...FALLBACK_MODELS.filter((fallbackModel) => fallbackModel !== model)]
    this.promptBuilder = new AgentPromptBuilder()
  }

  /**
   * Comprueba que la API key permita consultar el modelo externo.
   *
   * Esta validacion no guarda la llave. Solo hace una llamada pequena al
   * proveedor para confirmar que la sesion puede continuar.
   *
   * @returns {Promise<boolean>}
   */
  async validateAccess() {
    const response = await this.generateJson({
      systemPrompt: 'Responda unicamente con JSON valido.',
      userPrompt: 'Devuelva exactamente este objeto JSON: {"ok":true}',
      maxOutputTokens: 64,
    })

    if (response?.ok !== true && response?.ok !== 'true') {
      throw new Error('No se pudo validar la API key. Revise que esté completa y vuelva a intentarlo.')
    }

    return true
  }

  /**
   * Solicita al agente la seleccion del algoritmo.
   *
   * @param {object} request
   * @returns {Promise<object>}
   */
  async decide(request) {
    const response = this.normalizeDecision(await this.generateJson({
      systemPrompt: this.promptBuilder.buildSystemPrompt(),
      userPrompt: this.promptBuilder.buildUserPrompt(request),
      maxOutputTokens: 2048,
    }))
    const validation = validateAgentDecision(response)

    if (!validation.isValid) {
      throw new Error('El agente respondió con información incompleta. Intente consultar de nuevo.')
    }

    return response
  }

  /**
   * Solicita al agente una explicacion final luego de ejecutar el algoritmo local.
   *
   * @param {object} request
   * @returns {Promise<object>}
   */
  async explainResult(request) {
    const response = this.normalizeResultExplanation(await this.generateJson({
      systemPrompt: this.promptBuilder.buildResultSystemPrompt(),
      userPrompt: this.promptBuilder.buildResultPrompt(request),
      maxOutputTokens: 2048,
    }))
    const validation = validateAgentResultExplanation(response)

    if (!validation.isValid) {
      throw new Error('El agente no pudo generar una explicación completa del resultado.')
    }

    return response
  }

  /**
   * Ejecuta una llamada JSON contra el modelo configurado.
   *
   * @param {{ systemPrompt: string, userPrompt: string, maxOutputTokens: number }} params
   * @returns {Promise<object>}
   */
  async generateJson(params) {
    let lastError = null

    for (const model of this.models) {
      try {
        return await this.tryGenerateJsonWithModel(model, params)
      } catch (error) {
        lastError = error

        if (!this.canTryNextModel(error)) {
          break
        }
      }
    }

    throw lastError || new Error('No se pudo consultar el agente.')
  }

  /**
   * @param {string} model
   * @param {{ systemPrompt: string, userPrompt: string, maxOutputTokens: number }} params
   * @returns {Promise<object>}
   */
  async tryGenerateJsonWithModel(model, params) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.buildRequestBody(params, model)),
    })

    if (!response.ok) {
      const detail = await this.readErrorDetail(response)
      const error = new Error(this.createProviderErrorMessage(response.status, detail))
      error.status = response.status
      error.model = model
      error.retryable = this.shouldTryFallbackModel(response.status, detail)
      throw error
    }

    const data = await response.json()
    const rawText = this.extractText(data)

    if (!rawText) {
      const reason = data?.promptFeedback?.blockReason
      throw new Error(
        reason
          ? 'El agente no pudo responder con los datos enviados. Revise el problema e intente de nuevo.'
          : 'El agente no envió una respuesta utilizable. Intente de nuevo.',
      )
    }

    return this.parseJson(rawText)
  }

  /**
   * @param {{ systemPrompt: string, userPrompt: string, maxOutputTokens: number }} params
   * @param {string} model
   * @returns {object}
   */
  buildRequestBody(params, model) {
    const generationConfig = {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: params.maxOutputTokens,
    }

    if (model.includes('2.5')) {
      generationConfig.thinkingConfig = {
        thinkingBudget: 0,
      }
    }

    return {
      systemInstruction: {
        parts: [{ text: params.systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: params.userPrompt }],
        },
      ],
      generationConfig,
    }
  }

  /**
   * @param {Response} response
   * @returns {Promise<string>}
   */
  async readErrorDetail(response) {
    try {
      const data = await response.json()
      const message = data?.error?.message || data?.message

      if (message) {
        return this.sanitizeMessage(message)
      }
    } catch {
      return ''
    }

    return ''
  }

  /**
   * Convierte errores del proveedor en mensajes aptos para la interfaz.
   *
   * @param {number} status
   * @param {string} detail
   * @returns {string}
   */
  createProviderErrorMessage(status, detail) {
    const detailText = detail.toLowerCase()

    if (
      status === 400 &&
      (detailText.includes('api key') || detailText.includes('key not valid'))
    ) {
      return 'La API key no parece ser válida. Revise que esté completa y vuelva a intentarlo.'
    }

    if (status === 401 || status === 403 || detailText.includes('permission')) {
      return 'La API key no tiene permisos para consultar el agente. Revise la llave ingresada.'
    }

    if (status === 429 || detailText.includes('quota')) {
      return 'El servicio del agente alcanzó su límite de uso por ahora. Intente nuevamente más tarde.'
    }

    if (status === 404 || detailText.includes('model')) {
      return 'El modelo configurado no está disponible en este momento. Intente nuevamente.'
    }

    if (status >= 500) {
      return 'El servicio del agente no está respondiendo correctamente. Intente nuevamente en unos minutos.'
    }

    return 'No se pudo completar la consulta con el agente. Revise la conexión e intente de nuevo.'
  }

  /**
   * @param {unknown} data
   * @returns {string}
   */
  extractText(data) {
    if (typeof data === 'string') {
      return data
    }

    return data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim()
  }

  /**
   * @param {unknown} value
   * @returns {object}
   */
  parseJson(value) {
    if (value && typeof value === 'object') {
      return this.normalizeParsedJson(value)
    }

    const candidates = this.getJsonCandidates(String(value || ''))

    for (const candidate of candidates) {
      try {
        return this.normalizeParsedJson(JSON.parse(candidate))
      } catch {
        // Se intenta con la siguiente forma posible del mismo texto.
      }
    }

    throw new Error('El agente respondió con un formato que la aplicación no pudo leer. Intente consultar de nuevo.')
  }

  /**
   * @param {string} text
   * @returns {string[]}
   */
  getJsonCandidates(text) {
    const cleanText = text
      .replace(/^\uFEFF/, '')
      .trim()
    const candidates = new Set([cleanText])
    const fencedMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/i)

    if (fencedMatch?.[1]) {
      candidates.add(fencedMatch[1].trim())
    }

    const labelCleanText = cleanText.replace(/^json\s*:?/i, '').trim()
    candidates.add(labelCleanText)

    const objectCandidate = this.extractBalancedJson(labelCleanText, '{', '}')
    const arrayCandidate = this.extractBalancedJson(labelCleanText, '[', ']')

    if (objectCandidate) {
      candidates.add(objectCandidate)
    }

    if (arrayCandidate) {
      candidates.add(arrayCandidate)
    }

    return [...candidates].filter((candidate) => candidate.length > 0)
  }

  /**
   * @param {string} text
   * @param {string} openChar
   * @param {string} closeChar
   * @returns {string}
   */
  extractBalancedJson(text, openChar, closeChar) {
    const start = text.indexOf(openChar)

    if (start === -1) {
      return ''
    }

    let depth = 0
    let isInsideString = false
    let isEscaped = false

    for (let index = start; index < text.length; index += 1) {
      const character = text[index]

      if (isInsideString) {
        if (isEscaped) {
          isEscaped = false
        } else if (character === '\\') {
          isEscaped = true
        } else if (character === '"') {
          isInsideString = false
        }

        continue
      }

      if (character === '"') {
        isInsideString = true
      } else if (character === openChar) {
        depth += 1
      } else if (character === closeChar) {
        depth -= 1

        if (depth === 0) {
          return text.slice(start, index + 1)
        }
      }
    }

    return ''
  }

  /**
   * @param {unknown} value
   * @returns {object}
   */
  normalizeParsedJson(value) {
    if (typeof value === 'string') {
      return this.parseJson(value)
    }

    if (Array.isArray(value)) {
      const firstObject = value.find((item) => item && typeof item === 'object' && !Array.isArray(item))

      if (firstObject) {
        return firstObject
      }
    }

    return value
  }

  /**
   * @param {object} decision
   * @returns {object}
   */
  normalizeDecision(decision) {
    return {
      ...decision,
      selectedAlgorithm: this.normalizeAlgorithmId(decision?.selectedAlgorithm),
      estimatedTimeMs: Math.max(1, this.toNumber(decision?.estimatedTimeMs)),
      estimatedOperations: this.toNumber(decision?.estimatedOperations),
      confidence: this.toNumber(decision?.confidence),
      reason: String(decision?.reason || '').trim(),
    }
  }

  /**
   * @param {object} explanation
   * @returns {object}
   */
  normalizeResultExplanation(explanation) {
    return {
      summary: String(explanation?.summary || '').trim(),
      estimateComparison: String(explanation?.estimateComparison || '').trim(),
      resultQuality: String(explanation?.resultQuality || '').trim(),
      recommendation: String(explanation?.recommendation || '').trim(),
    }
  }

  /**
   * @param {unknown} value
   * @returns {number}
   */
  toNumber(value) {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : Number.NaN
  }

  /**
   * @param {unknown} value
   * @returns {string}
   */
  normalizeAlgorithmId(value) {
    const text = String(value || '')
      .trim()
      .toLowerCase()
      .replaceAll('_', '-')

    const aliases = {
      backtracking: 'backtracking',
      bt: 'backtracking',
      'dynamic-programming': 'dynamic-programming',
      dynamic: 'dynamic-programming',
      dp: 'dynamic-programming',
      greedy: 'greedy',
      greedySolver: 'greedy',
    }

    return AVAILABLE_ALGORITHMS.includes(text) ? text : aliases[text]
  }

  /**
   * @param {Error & { retryable?: boolean }} error
   * @returns {boolean}
   */
  canTryNextModel(error) {
    return error.retryable === true
  }

  /**
   * @param {number} status
   * @param {string} detail
   * @returns {boolean}
   */
  shouldTryFallbackModel(status, detail) {
    const detailText = detail.toLowerCase()

    if (detailText.includes('api key') || detailText.includes('permission') || detailText.includes('quota')) {
      return false
    }

    return status === 404 || (status === 400 && detailText.includes('model'))
  }

  /**
   * @param {string} message
   * @returns {string}
   */
  sanitizeMessage(message) {
    return message.replaceAll(this.apiKey, '[API_KEY]')
  }
}
