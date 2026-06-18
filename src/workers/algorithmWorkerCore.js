import { AlgorithmRunner } from '../services/AlgorithmRunner.js'

const runner = new AlgorithmRunner()

/**
 * Ejecuta un algoritmo dentro del worker y conserva un contrato simple.
 *
 * @param {{ requestId: string, problem: object, algorithmId: string, options?: object }} payload
 * @returns {{ requestId: string, type: string, result?: object, message?: string }}
 */
export function runAlgorithmWorkerTask(payload) {
  try {
    const result = runner.run(payload.problem, payload.algorithmId, payload.options || {})

    return {
      requestId: payload.requestId,
      type: 'success',
      result,
    }
  } catch (error) {
    return {
      requestId: payload.requestId,
      type: 'error',
      message:
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo ejecutar el algoritmo seleccionado.',
    }
  }
}

