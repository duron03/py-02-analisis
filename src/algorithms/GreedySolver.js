import { KnapsackSolution } from '../domain/KnapsackSolution.js'
import { ExecutionControl } from '../services/ExecutionControl.js'
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
   * @param {{ timeLimitMs?: number, checkInterval?: number }} [options]
   * @returns {KnapsackSolution}
   */
  solve(problem, options = {}) {
    this.validateProblem(problem)

    const timer = new PerformanceTimer()
    const executionControl = new ExecutionControl(options)
    let operationCount = 0
    const selectedItems = []
    let currentWeight = 0

    timer.start()

    const compareItems = (firstItem, secondItem) => {
      operationCount += 1
      const densityDifference = secondItem.getDensity() - firstItem.getDensity()

      if (densityDifference !== 0) {
        return densityDifference
      }

      return secondItem.value - firstItem.value
    }

    const mergeByDensity = (leftItems, rightItems) => {
      const sortedItems = []
      let leftIndex = 0
      let rightIndex = 0

      while (leftIndex < leftItems.length && rightIndex < rightItems.length) {
        if (executionControl.shouldStop()) {
          return sortedItems
            .concat(leftItems.slice(leftIndex))
            .concat(rightItems.slice(rightIndex))
        }

        if (compareItems(leftItems[leftIndex], rightItems[rightIndex]) <= 0) {
          sortedItems.push(leftItems[leftIndex])
          leftIndex += 1
        } else {
          sortedItems.push(rightItems[rightIndex])
          rightIndex += 1
        }
      }

      return sortedItems
        .concat(leftItems.slice(leftIndex))
        .concat(rightItems.slice(rightIndex))
    }

    const sortByDensity = (items) => {
      if (items.length <= 1 || executionControl.shouldStop()) {
        return items
      }

      const middle = Math.floor(items.length / 2)
      const leftItems = sortByDensity(items.slice(0, middle))
      const rightItems = sortByDensity(items.slice(middle))

      return mergeByDensity(leftItems, rightItems)
    }

    const sortedItems = sortByDensity(problem.items.slice())

    for (const item of sortedItems) {
      operationCount += 1

      if (executionControl.shouldStop()) {
        break
      }

      if (currentWeight + item.weight <= problem.capacity) {
        selectedItems.push(item.clone())
        currentWeight += item.weight
      }
    }

    const executionTimeMs = timer.stop()
    const wasInterrupted = executionControl.wasInterrupted

    return new KnapsackSolution({
      selectedItems,
      algorithmName: this.name,
      algorithmId: this.id,
      executionTimeMs,
      operationCount,
      isOptimal: false,
      wasInterrupted,
      interruptionReason: wasInterrupted ? 'time-limit' : '',
      timeLimitMs: executionControl.getTimeLimitMs(),
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
