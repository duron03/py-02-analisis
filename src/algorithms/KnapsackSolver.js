/**
 * Clase base sencilla para los algoritmos de mochila.
 */
export class KnapsackSolver {
  constructor() {
    this.id = 'base'
    this.name = 'Solver base'
  }

  /**
   * Metodo que deben implementar las clases hijas.
   */
  solve() {
    throw new Error('El metodo solve debe ser implementado por cada algoritmo.')
  }

  /**
   * @returns {string}
   */
  getId() {
    return this.id
  }

  /**
   * @returns {string}
   */
  getName() {
    return this.name
  }

  /**
   * @returns {{ time: string, space: string }}
   */
  getComplexityInfo() {
    return {
      time: 'No definido',
      space: 'No definido',
    }
  }

  /**
   * Lanza un error entendible si el problema no es valido.
   *
   * @param {import('../domain/KnapsackProblem.js').KnapsackProblem} problem
   */
  validateProblem(problem) {
    const validation = problem.validate()

    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '))
    }
  }
}

