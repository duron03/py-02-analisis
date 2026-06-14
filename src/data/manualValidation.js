import { AlgorithmRunner } from '../services/AlgorithmRunner.js'
import { sampleProblems } from './sampleProblems.js'

/**
 * Ejecuta casos pequenos para validar manualmente los algoritmos.
 *
 * @returns {Array<object>}
 */
export function runManualValidation() {
  const runner = new AlgorithmRunner()
  const algorithmIds = ['backtracking', 'dynamic-programming', 'greedy']

  return sampleProblems.map((sample) => {
    const results = algorithmIds.map((algorithmId) =>
      runner.run(sample.problem, algorithmId),
    )

    return {
      sampleId: sample.id,
      sampleName: sample.name,
      expectedOptimalValue: sample.expectedOptimalValue,
      results,
    }
  })
}

