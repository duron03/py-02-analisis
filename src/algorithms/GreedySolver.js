import { KnapsackSolution } from '../domain/KnapsackSolution.js'
import { PerformanceTimer } from '../services/PerformanceTimer.js'
import { KnapsackSolver } from './KnapsackSolver.js'

/**
 * Solver heuristico usando densidad valor/peso.
 */
export class GreedySolver extends KnapsackSolver {
  constructor() {
    super()
    this.id = 'greedy'
    this.name = 'Greedy por densidad'
  }

  /**
   * Selecciona primero los objetos con mayor densidad.
   *
   * @param {import('../domain/KnapsackProblem.js').KnapsackProblem} problem
   * @returns {KnapsackSolution}
   */
  solve(problem) {
    this.validateProblem(problem)

    const timer = new PerformanceTimer()
    let operationCount = 0
    const selectedItems = []
    let currentWeight = 0

    timer.start()

    const sortedItems = problem.items.slice().sort((firstItem, secondItem) => {
      operationCount += 1
      const densityDifference = secondItem.getDensity() - firstItem.getDensity()

      if (densityDifference !== 0) {
        return densityDifference
      }

      return secondItem.value - firstItem.value
    })

    sortedItems.forEach((item) => {
      operationCount += 1

      if (currentWeight + item.weight <= problem.capacity) {
        selectedItems.push(item.clone())
        currentWeight += item.weight
      }
    })

    const executionTimeMs = timer.stop()

    return new KnapsackSolution({
      selectedItems,
      algorithmName: this.name,
      algorithmId: this.id,
      executionTimeMs,
      operationCount,
      isOptimal: false,
    })
  }

  /**
   * @returns {{ time: string, space: string }}
   */
  getComplexityInfo() {
    return {
      time: 'O(N log N)',
      space: 'O(N)',
    }
  }
}

