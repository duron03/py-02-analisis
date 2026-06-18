import { KnapsackSolution } from '../domain/KnapsackSolution.js'
import { ExecutionControl } from '../services/ExecutionControl.js'
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
   * @param {{ timeLimitMs?: number, checkInterval?: number }} [options]
   * @returns {KnapsackSolution}
   */
  solve(problem, options = {}) {
    this.validateProblem(problem)

    const timer = new PerformanceTimer()
    const executionControl = new ExecutionControl(options)
    let operationCount = 0
    let bestValue = 0
    let bestItems = []

    timer.start()

    const search = (index, currentItems, currentWeight, currentValue) => {
      operationCount += 1

      if (executionControl.shouldStop()) {
        return
      }

      if (currentWeight > problem.capacity) {
        return
      }

      if (currentValue > bestValue) {
        bestValue = currentValue
        bestItems = currentItems.slice()
      }

      if (index === problem.items.length) {
        return
      }

      const item = problem.items[index]

      currentItems.push(item)
      search(
        index + 1,
        currentItems,
        currentWeight + item.weight,
        currentValue + item.value,
      )
      currentItems.pop()

      if (executionControl.shouldStop(true)) {
        return
      }

      search(index + 1, currentItems, currentWeight, currentValue)
    }

    search(0, [], 0, 0)
    const executionTimeMs = timer.stop()
    const wasInterrupted = executionControl.wasInterrupted

    return new KnapsackSolution({
      selectedItems: bestItems.map((item) => item.clone()),
      algorithmName: this.name,
      algorithmId: this.id,
      executionTimeMs,
      operationCount,
      isOptimal: !wasInterrupted,
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
      time: 'O(2^n)',
      space: 'O(n)',
    }
  }
}
