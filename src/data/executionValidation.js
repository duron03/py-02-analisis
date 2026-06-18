import { AlgorithmRunner } from '../services/AlgorithmRunner.js'
import { runAlgorithmWorkerTask } from '../workers/algorithmWorkerCore.js'
import { sampleProblems } from './sampleProblems.js'

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function createStressProblem(itemCount, capacity) {
  return {
    capacity,
    items: Array.from({ length: itemCount }, (_, index) => ({
      id: index + 1,
      name: `Objeto ${index + 1}`,
      weight: (index % 17) + 1,
      value: ((index * 37) % 101) + 1,
    })),
  }
}

function validateSolution(problem, result) {
  const selectedWeight = result.selectedItems.reduce(
    (total, item) => total + Number(item.weight),
    0,
  )
  const selectedValue = result.selectedItems.reduce(
    (total, item) => total + Number(item.value),
    0,
  )

  assertCondition(selectedWeight <= problem.capacity, 'La solucion supera la capacidad.')
  assertCondition(selectedWeight === result.totalWeight, 'El peso total no coincide.')
  assertCondition(selectedValue === result.totalValue, 'El valor total no coincide.')
  assertCondition(result.operationCount > 0, 'El conteo de operaciones debe ser positivo.')
}

/**
 * Valida resultados exactos, cortes por tiempo y contrato base del worker.
 *
 * @returns {Array<object>}
 */
export function runExecutionValidation() {
  const runner = new AlgorithmRunner()
  const report = []
  const baseSample = sampleProblems[0]

  const backtrackingResult = runner.run(baseSample.problem, 'backtracking')
  const dynamicResult = runner.run(baseSample.problem, 'dynamic-programming')
  const greedyResult = runner.run(baseSample.problem, 'greedy')

  assertCondition(
    backtrackingResult.totalValue === baseSample.expectedOptimalValue,
    'Backtracking no alcanzo el optimo esperado.',
  )
  assertCondition(
    dynamicResult.totalValue === baseSample.expectedOptimalValue,
    'Programacion Dinamica no alcanzo el optimo esperado.',
  )
  assertCondition(!backtrackingResult.wasInterrupted, 'Backtracking no debia interrumpirse.')
  assertCondition(!dynamicResult.wasInterrupted, 'Programacion Dinamica no debia interrumpirse.')
  validateSolution(baseSample.problem, backtrackingResult)
  validateSolution(baseSample.problem, dynamicResult)
  validateSolution(baseSample.problem, greedyResult)

  report.push({
    name: 'optimos-sin-limite',
    backtrackingValue: backtrackingResult.totalValue,
    dynamicProgrammingValue: dynamicResult.totalValue,
    greedyValue: greedyResult.totalValue,
  })

  const backtrackingStress = createStressProblem(25, 120)
  const interruptedBacktracking = runner.run(backtrackingStress, 'backtracking', {
    timeLimitMs: 2,
    checkInterval: 1,
  })

  assertCondition(
    interruptedBacktracking.wasInterrupted,
    'Backtracking debia detenerse por limite de tiempo.',
  )
  assertCondition(
    !interruptedBacktracking.isOptimal,
    'Una ejecucion interrumpida no debe marcarse como optima.',
  )
  validateSolution(backtrackingStress, interruptedBacktracking)

  report.push({
    name: 'backtracking-interrumpido',
    value: interruptedBacktracking.totalValue,
    operations: interruptedBacktracking.operationCount,
    timeMs: interruptedBacktracking.executionTimeMs,
  })

  const dynamicStress = createStressProblem(60, 5000)
  const interruptedDynamic = runner.run(dynamicStress, 'dynamic-programming', {
    timeLimitMs: 2,
    checkInterval: 1,
  })

  assertCondition(
    interruptedDynamic.wasInterrupted,
    'Programacion Dinamica debia detenerse por limite de tiempo.',
  )
  assertCondition(
    !interruptedDynamic.isOptimal,
    'Programacion Dinamica interrumpida no debe marcarse como optima.',
  )
  assertCondition(
    interruptedDynamic.totalValue > 0,
    'Programacion Dinamica debia entregar una solucion parcial con valor positivo.',
  )
  validateSolution(dynamicStress, interruptedDynamic)

  report.push({
    name: 'dynamic-programming-interrumpido',
    value: interruptedDynamic.totalValue,
    operations: interruptedDynamic.operationCount,
    timeMs: interruptedDynamic.executionTimeMs,
  })

  const greedyStress = createStressProblem(10000, 350)
  const interruptedGreedy = runner.run(greedyStress, 'greedy', {
    timeLimitMs: 1,
    checkInterval: 1,
  })

  assertCondition(interruptedGreedy.wasInterrupted, 'Greedy debia reportar interrupcion.')
  validateSolution(greedyStress, interruptedGreedy)

  report.push({
    name: 'greedy-interrumpido',
    value: interruptedGreedy.totalValue,
    operations: interruptedGreedy.operationCount,
    timeMs: interruptedGreedy.executionTimeMs,
  })

  const workerResponse = runAlgorithmWorkerTask({
    requestId: 'core-test-1',
    problem: baseSample.problem,
    algorithmId: 'dynamic-programming',
    options: { timeLimitMs: 1000 },
  })

  assertCondition(workerResponse.type === 'success', 'El worker core debia responder success.')
  assertCondition(
    workerResponse.result.totalValue === baseSample.expectedOptimalValue,
    'El worker core no devolvio el optimo esperado.',
  )

  report.push({
    name: 'worker-core',
    value: workerResponse.result.totalValue,
    operations: workerResponse.result.operationCount,
  })

  return report
}
