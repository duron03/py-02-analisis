import { BacktrackingSolver } from '../algorithms/BacktrackingSolver.js'
import { DynamicProgrammingSolver } from '../algorithms/DynamicProgrammingSolver.js'
import { GreedySolver } from '../algorithms/GreedySolver.js'
import { KnapsackProblem } from '../domain/KnapsackProblem.js'

/**
 * Centraliza la ejecucion de los algoritmos disponibles.
 */
export class AlgorithmRunner {
  constructor() {
    this.solvers = [
      new BacktrackingSolver(),
      new DynamicProgrammingSolver(),
      new GreedySolver(),
    ]
  }

  /**
   * Devuelve informacion basica para la GUI o el agente.
   *
   * @returns {Array<{ id: string, name: string, complexity: object }>}
   */
  getAvailableAlgorithms() {
    return this.solvers.map((solver) => ({
      id: solver.getId(),
      name: solver.getName(),
      complexity: solver.getComplexityInfo(),
    }))
  }

  /**
   * Ejecuta el algoritmo indicado y devuelve un resultado plano.
   *
   * @param {object|KnapsackProblem} problemInput
   * @param {string} algorithmId
   * @returns {object}
   */
  run(problemInput, algorithmId) {
    const problem =
      problemInput instanceof KnapsackProblem
        ? problemInput.clone()
        : new KnapsackProblem(problemInput)
    const solver = this.findSolver(algorithmId)
    const solution = solver.solve(problem)

    return solution.toPlainObject()
  }

  /**
   * @param {string} algorithmId
   * @returns {import('../algorithms/KnapsackSolver.js').KnapsackSolver}
   */
  findSolver(algorithmId) {
    const solver = this.solvers.find((currentSolver) => currentSolver.getId() === algorithmId)

    if (!solver) {
      throw new Error('No se encontró el algoritmo seleccionado.')
    }

    return solver
  }
}
