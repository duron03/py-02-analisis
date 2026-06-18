/**
 * Valida el archivo real del Web Worker usando worker_threads de Node.
 *
 * @returns {Promise<object>}
 */
export async function runWorkerThreadValidation() {
  const { Worker } = await import('node:worker_threads')
  const workerUrl = new URL('../workers/algorithmWorker.js', import.meta.url)

  const createWorker = () => {
    const bridgeCode = `
    import { parentPort } from 'node:worker_threads'

    globalThis.self = {
      onmessage: null,
      postMessage: (message) => parentPort.postMessage(message),
    }

    await import(${JSON.stringify(workerUrl.href)})

    parentPort.on('message', (message) => {
      globalThis.self.onmessage({ data: message })
    })
  `

    return new Worker(bridgeCode, {
      eval: true,
      type: 'module',
    })
  }

  const runInWorker = (payload) =>
    new Promise((resolve, reject) => {
      const worker = createWorker()
      const timeoutId = setTimeout(() => {
        worker.terminate()
        reject(new Error('El worker no respondio a tiempo.'))
      }, 5000)

      worker.once('message', (message) => {
        clearTimeout(timeoutId)
        worker.terminate()

        if (message.type !== 'success') {
          reject(new Error(message.message || 'El worker respondio con error.'))
          return
        }

        resolve(message.result)
      })

      worker.once('error', (error) => {
        clearTimeout(timeoutId)
        worker.terminate()
        reject(error)
      })

      worker.postMessage(payload)
    })

  const problem = {
    capacity: 7,
    items: [
      { id: 1, name: 'Objeto 1', weight: 3, value: 4 },
      { id: 2, name: 'Objeto 2', weight: 4, value: 5 },
      { id: 3, name: 'Objeto 3', weight: 2, value: 3 },
      { id: 4, name: 'Objeto 4', weight: 5, value: 8 },
    ],
  }

  const normalResult = await runInWorker({
    requestId: 'node-worker-validation',
    problem,
    algorithmId: 'dynamic-programming',
    options: {
      timeLimitMs: 1000,
    },
  })

  if (normalResult.totalValue !== 11) {
    throw new Error('El worker no devolvio el valor optimo esperado.')
  }

  const stressProblem = {
    capacity: 120,
    items: Array.from({ length: 25 }, (_, index) => ({
      id: index + 1,
      name: `Objeto ${index + 1}`,
      weight: (index % 17) + 1,
      value: ((index * 37) % 101) + 1,
    })),
  }

  const interruptedResult = await runInWorker({
    requestId: 'node-worker-validation-interrupted',
    problem: stressProblem,
    algorithmId: 'backtracking',
    options: {
      timeLimitMs: 2,
      checkInterval: 1,
    },
  })

  if (!interruptedResult.wasInterrupted) {
    throw new Error('El worker debia devolver una ejecucion interrumpida.')
  }

  return {
    normal: {
      algorithmName: normalResult.algorithmName,
      totalValue: normalResult.totalValue,
      operationCount: normalResult.operationCount,
      wasInterrupted: normalResult.wasInterrupted,
    },
    interrupted: {
      algorithmName: interruptedResult.algorithmName,
      totalValue: interruptedResult.totalValue,
      operationCount: interruptedResult.operationCount,
      executionTimeMs: interruptedResult.executionTimeMs,
      wasInterrupted: interruptedResult.wasInterrupted,
    },
  }
}
