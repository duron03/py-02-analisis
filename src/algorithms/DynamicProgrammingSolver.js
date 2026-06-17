import { KnapsackSolution } from '../domain/KnapsackSolution.js'
import { PerformanceTimer } from '../services/PerformanceTimer.js'
import { KnapsackSolver } from './KnapsackSolver.js'

/**
 * Solver exacto usando programacion dinamica bottom-up.
 */
export class DynamicProgrammingSolver extends KnapsackSolver {
  constructor() {
    super()
    this.id = 'dynamic-programming'
    this.name = 'Programación Dinámica'
  }

  /**
   * Resuelve el problema llenando una tabla de subproblemas.
   *
   * @param {import('../domain/KnapsackProblem.js').KnapsackProblem} problem
   * @returns {KnapsackSolution}
   */
  solve(problem) {
    this.validateProblem(problem)

    const timer = new PerformanceTimer()
    const itemCount = problem.items.length
    const capacity = problem.capacity
    let operationCount = 0

    timer.start()

    const table = Array.from({ length: itemCount + 1 }, () =>
      Array(capacity + 1).fill(0),
    )

    for (let itemIndex = 1; itemIndex <= itemCount; itemIndex += 1) {
      const item = problem.items[itemIndex - 1]

      for (let currentCapacity = 0; currentCapacity <= capacity; currentCapacity += 1) {
        operationCount += 1

        if (item.weight <= currentCapacity) {
          const valueWithItem =
            item.value + table[itemIndex - 1][currentCapacity - item.weight]
          const valueWithoutItem = table[itemIndex - 1][currentCapacity]
          table[itemIndex][currentCapacity] = Math.max(valueWithItem, valueWithoutItem)
        } else {
          table[itemIndex][currentCapacity] = table[itemIndex - 1][currentCapacity]
        }
      }
    }

    const selectedItems = []
    let remainingCapacity = capacity

    for (let itemIndex = itemCount; itemIndex > 0; itemIndex -= 1) {
      if (table[itemIndex][remainingCapacity] !== table[itemIndex - 1][remainingCapacity]) {
        const item = problem.items[itemIndex - 1]
        selectedItems.push(item.clone())
        remainingCapacity -= item.weight
      }
    }

    const executionTimeMs = timer.stop()

    return new KnapsackSolution({
      selectedItems: selectedItems.reverse(),
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
      time: 'O(N * W)',
      space: 'O(N * W)',
    }
  }
}
