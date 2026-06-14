import { KnapsackSolution } from '../domain/KnapsackSolution.js'
import { PerformanceTimer } from '../services/PerformanceTimer.js'
import { KnapsackSolver } from './KnapsackSolver.js'

/**
 * Solver exacto usando backtracking puro.
 */
export class BacktrackingSolver extends KnapsackSolver {
  constructor() {
    super()
    this.id = 'backtracking'
    this.name = 'Backtracking'
  }

  /**
   * Resuelve el problema probando incluir o excluir cada objeto.
   *
   * @param {import('../domain/KnapsackProblem.js').KnapsackProblem} problem
   * @returns {KnapsackSolution}
   */
  solve(problem) {
    this.validateProblem(problem)

    const timer = new PerformanceTimer()
    let operationCount = 0
    let bestValue = 0
    let bestItems = []

    timer.start()

    const search = (index, currentItems, currentWeight, currentValue) => {
      operationCount += 1

      if (currentWeight > problem.capacity) {
        return
      }

      if (index === problem.items.length) {
        if (currentValue > bestValue) {
          bestValue = currentValue
          bestItems = currentItems.slice()
        }
        return
      }

      const item = problem.items[index]

      search(index + 1, currentItems, currentWeight, currentValue)

      currentItems.push(item)
      search(
        index + 1,
        currentItems,
        currentWeight + item.weight,
        currentValue + item.value,
      )
      currentItems.pop()
    }

    search(0, [], 0, 0)
    const executionTimeMs = timer.stop()

    return new KnapsackSolution({
      selectedItems: bestItems.map((item) => item.clone()),
      algorithmName: this.name,
      algorithmId: this.id,
      executionTimeMs,
      operationCount,
      isOptimal: true,
    })
  }

  /**
   * @returns {{ time: string, space: string }}
   */
  getComplexityInfo() {
    return {
      time: 'O(2^n)',
      space: 'O(n)',
    }
  }
}

