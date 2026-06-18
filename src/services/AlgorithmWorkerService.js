import { AlgorithmRunner } from './AlgorithmRunner.js'

const fallbackRunner = new AlgorithmRunner()

/**
 * Ejecuta algoritmos en un Web Worker cuando el navegador lo permite.
 */
export class AlgorithmWorkerService {
  /**
   * @param {object} problem
   * @param {string} algorithmId
   * @param {{ timeLimitMs?: number, checkInterval?: number, signal?: AbortSignal }} [options]
   * @returns {Promise<object>}
   */
  run(problem, algorithmId, options = {}) {
    if (typeof Worker === 'undefined') {
      return Promise.resolve(fallbackRunner.run(problem, algorithmId, options))
    }

    return new Promise((resolve, reject) => {
      const requestId = `run-${Date.now()}-${Math.random().toString(16).slice(2)}`
      const worker = new Worker(new URL('../workers/algorithmWorker.js', import.meta.url), {
        type: 'module',
      })

      const cleanup = () => {
        worker.terminate()
        options.signal?.removeEventListener('abort', handleAbort)
      }

      const handleAbort = () => {
        cleanup()
        reject(new Error('La ejecución local fue cancelada.'))
      }

      worker.onmessage = (event) => {
        const data = event.data

        if (data?.requestId !== requestId) {
          return
        }

        cleanup()

        if (data.type === 'success') {
          resolve(data.result)
          return
        }

        reject(new Error(data.message || 'No se pudo ejecutar el algoritmo seleccionado.'))
      }

      worker.onerror = () => {
        cleanup()
        reject(new Error('No se pudo iniciar la ejecución local en segundo plano.'))
      }

      if (options.signal?.aborted) {
        handleAbort()
        return
      }

      options.signal?.addEventListener('abort', handleAbort)

      worker.postMessage({
        requestId,
        problem,
        algorithmId,
        options: {
          timeLimitMs: options.timeLimitMs,
          checkInterval: options.checkInterval,
        },
      })
    })
  }
}

