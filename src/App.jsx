import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  PRIORITIES,
  createAgentRequest,
  createAgentResultRequest,
  validateAgentDecision,
} from './agent/AgentDecisionContract.js'
import AgentReviewFrame from './components/agent/AgentReviewFrame.jsx'
import LoginScreen from './components/auth/LoginScreen.jsx'
import LoadingScreen from './components/common/LoadingScreen.jsx'
import ProblemSetupFrame from './components/problem/ProblemSetupFrame.jsx'
import ResultsFrame from './components/results/ResultsFrame.jsx'
import WelcomeFrame from './components/welcome/WelcomeFrame.jsx'
import { sampleProblems } from './data/sampleProblems.js'
import { AgentDecisionService } from './services/AgentDecisionService.js'
import { AlgorithmRunner } from './services/AlgorithmRunner.js'
import { generateRandomProblem } from './utils/randomProblemGenerator.js'
import { validateConstraints, validateProblemInput } from './utils/validators.js'

const MIN_ITEMS = 4
const MAX_ITEMS = 25
const MIN_CAPACITY = 1
const MAX_CAPACITY = 500
const MIN_TIME_LIMIT_SECONDS = 1
const MAX_TIME_LIMIT_SECONDS = 10800
const AGENT_MODEL = 'gemini-2.5-flash'

const FRAMES = {
  LOGIN: 'login',
  LOADING: 'loading',
  WELCOME: 'welcome',
  SETUP: 'setup',
  AGENT_REVIEW: 'agent-review',
  EXECUTING: 'executing',
  RESULTS: 'results',
}

const algorithmRunner = new AlgorithmRunner()

function createMessage() {
  return {
    tipo: '',
    texto: '',
  }
}

function createInitialItems() {
  return sampleProblems[0].problem.items.map((item) => ({ ...item }))
}

function createNewItem(index) {
  return {
    id: index + 1,
    name: `Objeto ${index + 1}`,
    weight: 1,
    value: 1,
  }
}

function clampInteger(value, min, max, fallback) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.trunc(numberValue)))
}

function isBlankInput(value) {
  return value === '' || value === null || value === undefined
}

function isIntegerInput(value) {
  return !isBlankInput(value) && /^\d+$/.test(String(value)) && Number.isInteger(Number(value))
}

function isIntegerInRange(value, min, max) {
  const numberValue = Number(value)
  return isIntegerInput(value) && numberValue >= min && numberValue <= max
}

function getOnlyDigits(value) {
  return value.replace(/\D/g, '')
}

function clampInputValue(value, min, max, fallback) {
  return String(clampInteger(value, min, max, fallback))
}

function resizeItems(items, nextCount) {
  if (nextCount <= items.length) {
    return items.slice(0, nextCount).map((item, index) => ({
      ...item,
      id: index + 1,
      name: item.name || `Objeto ${index + 1}`,
    }))
  }

  return Array.from({ length: nextCount }, (_, index) => {
    if (items[index]) {
      return {
        ...items[index],
        id: index + 1,
        name: items[index].name || `Objeto ${index + 1}`,
      }
    }

    return createNewItem(index)
  })
}

function buildProblem(items, capacity) {
  return {
    capacity: Number(capacity),
    items: items.map((item, index) => ({
      id: index + 1,
      name: item.name.trim() || `Objeto ${index + 1}`,
      weight: Number(item.weight),
      value: Number(item.value),
    })),
  }
}

function buildConstraints(priority, timeLimitSeconds) {
  return {
    priority,
    timeLimitSeconds: Number(timeLimitSeconds),
  }
}

function calculateTotals(items) {
  return items.reduce(
    (totals, item) => {
      const weightIsValid = isIntegerInput(item.weight) && Number(item.weight) > 0
      const valueIsValid = isIntegerInput(item.value) && Number(item.value) >= 0

      return {
        weight: weightIsValid ? totals.weight + Number(item.weight) : totals.weight,
        value: valueIsValid ? totals.value + Number(item.value) : totals.value,
        weightIsComplete: totals.weightIsComplete && weightIsValid,
        valueIsComplete: totals.valueIsComplete && valueIsValid,
      }
    },
    {
      weight: 0,
      value: 0,
      weightIsComplete: true,
      valueIsComplete: true,
    },
  )
}

function createAgentService(apiKey) {
  return new AgentDecisionService(apiKey, AGENT_MODEL)
}

function buildPerformanceComparison(decision, result) {
  const estimatedTimeMs = Number(decision?.estimatedTimeMs || 0)
  const realTimeMs = Number(result?.executionTimeMs || 0)
  const estimatedOperations = Number(decision?.estimatedOperations || 0)
  const realOperations = Number(result?.operationCount || 0)

  return {
    estimatedTimeMs,
    realTimeMs,
    timeDifferenceMs: realTimeMs - estimatedTimeMs,
    estimatedOperations,
    realOperations,
    operationsDifference: realOperations - estimatedOperations,
  }
}

function getAgentErrorMessage(error) {
  if (error instanceof Error && error.message) {
    const lowerMessage = error.message.toLowerCase()

    if (
      lowerMessage.includes('failed to fetch') ||
      lowerMessage.includes('networkerror') ||
      lowerMessage.includes('load failed')
    ) {
      return 'No se pudo conectar con el servicio del agente. Revise su conexión e intente de nuevo.'
    }

    return error.message
  }

  return 'No se pudo completar la consulta con el agente.'
}

function App() {
  const [frame, setFrame] = useState(FRAMES.LOGIN)
  const [transition, setTransition] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [loginMessage, setLoginMessage] = useState(createMessage)
  const [items, setItems] = useState(createInitialItems)
  const [itemCountInput, setItemCountInput] = useState(String(sampleProblems[0].problem.items.length))
  const [capacity, setCapacity] = useState(sampleProblems[0].problem.capacity)
  const [priority, setPriority] = useState(PRIORITIES.ACCURACY)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(3)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dynamic-programming')
  const [agentDecision, setAgentDecision] = useState(null)
  const [agentResultExplanation, setAgentResultExplanation] = useState(null)
  const [solution, setSolution] = useState(null)
  const [message, setMessage] = useState(createMessage)
  const [executionRequest, setExecutionRequest] = useState(null)
  const [runCounter, setRunCounter] = useState(0)

  const algorithms = useMemo(() => algorithmRunner.getAvailableAlgorithms(), [])
  const selectedAlgorithmInfo = algorithms.find((algorithm) => algorithm.id === selectedAlgorithm)
  const totals = calculateTotals(items)
  const selectedItemIds = useMemo(
    () => new Set((solution?.selectedItems || []).map((item) => item.id)),
    [solution],
  )
  const maxItemValue = Math.max(...items.map((item) => Number(item.value) || 0), 1)

  useEffect(() => {
    if (frame !== FRAMES.LOADING || !transition?.nextFrame) {
      return undefined
    }

    const timer = setTimeout(() => {
      setFrame(transition.nextFrame)
      setTransition(null)
    }, transition.delayMs)

    return () => clearTimeout(timer)
  }, [frame, transition])

  useEffect(() => {
    if (frame !== FRAMES.EXECUTING || !executionRequest) {
      return undefined
    }

    let shouldIgnoreResult = false

    const timer = setTimeout(() => {
      async function runLocalExecution() {
        try {
          const result = algorithmRunner.run(
            executionRequest.problem,
            executionRequest.algorithmId,
          )

          let nextExplanation = null
          let nextMessage = {
            tipo: 'exito',
            texto: 'La ejecución local finalizó correctamente.',
          }

          if (executionRequest.mode === 'agent' && agentDecision) {
            try {
              const service = createAgentService(apiKey)
              const comparison = buildPerformanceComparison(agentDecision, result)
              const resultRequest = createAgentResultRequest({
                problem: executionRequest.problem,
                constraints: executionRequest.constraints,
                decision: agentDecision,
                solution: result,
                comparison,
              })

              nextExplanation = await service.explainResult(resultRequest)
            } catch (error) {
              nextMessage = {
                tipo: 'advertencia',
                texto: `${nextMessage.texto} No se pudo generar la explicación final del agente. ${getAgentErrorMessage(error)}`,
              }
            }
          }

          if (shouldIgnoreResult) {
            return
          }

          setSolution(result)
          setAgentResultExplanation(nextExplanation)
          setRunCounter((currentValue) => currentValue + 1)
          setMessage(nextMessage)
          setFrame(FRAMES.RESULTS)
        } catch {
          if (shouldIgnoreResult) {
            return
          }

          setMessage({
            tipo: 'error',
            texto: 'No se pudo completar la ejecución local. Revise los datos del problema e intente de nuevo.',
          })
          setFrame(FRAMES.SETUP)
        }
      }

      runLocalExecution()
    }, 700)

    return () => {
      shouldIgnoreResult = true
      clearTimeout(timer)
    }
  }, [agentDecision, apiKey, executionRequest, frame])

  function goToLoading(title, detail, nextFrame, delayMs = 1000) {
    setTransition({
      title,
      detail,
      nextFrame,
      delayMs,
    })
    setFrame(FRAMES.LOADING)
  }

  function clearOutputs() {
    setAgentDecision(null)
    setAgentResultExplanation(null)
    setSolution(null)
    setExecutionRequest(null)
    setMessage(createMessage())
  }

  function resetProblem() {
    const initialItems = createInitialItems()

    setItems(initialItems)
    setItemCountInput(String(initialItems.length))
    setCapacity(sampleProblems[0].problem.capacity)
    setPriority(PRIORITIES.ACCURACY)
    setTimeLimitSeconds(3)
    setSelectedAlgorithm('dynamic-programming')
    clearOutputs()
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()

    const nextApiKey = apiKey.trim()

    if (nextApiKey.length === 0) {
      setLoginMessage({
        tipo: 'error',
        texto: 'Ingrese una API key válida.',
      })
      return
    }

    setLoginMessage(createMessage())
    setTransition({
      title: 'Validando acceso',
      detail: 'Comprobando API key.',
      nextFrame: null,
      delayMs: 0,
    })
    setFrame(FRAMES.LOADING)

    try {
      const service = createAgentService(nextApiKey)
      await service.validateAccess()

      setApiKey(nextApiKey)
      goToLoading(
        'Acceso validado',
        'Preparando sesión.',
        FRAMES.WELCOME,
        700,
      )
    } catch (error) {
      setTransition(null)
      setFrame(FRAMES.LOGIN)
      setLoginMessage({
        tipo: 'error',
        texto: getAgentErrorMessage(error),
      })
    }
  }

  function handleLogout() {
    setApiKey('')
    setLoginMessage(createMessage())
    resetProblem()
    setRunCounter(0)
    goToLoading(
      'Cerrando sesión',
      'Desconectando...',
      FRAMES.LOGIN,
    )
  }

  function handleStartAttempt() {
    clearOutputs()
    setFrame(FRAMES.SETUP)
  }

  function handleNewAttempt() {
    resetProblem()
    setFrame(FRAMES.SETUP)
  }

  function handleAdjustProblem() {
    clearOutputs()
    setFrame(FRAMES.SETUP)
  }

  function handleReturnToSetup() {
    clearOutputs()
    setFrame(FRAMES.SETUP)
  }

  function handleReturnToWelcome() {
    clearOutputs()
    setFrame(FRAMES.WELCOME)
  }

  function handleItemCountChange(event) {
    const value = getOnlyDigits(event.target.value)

    setItemCountInput(value)
    clearOutputs()

    if (isBlankInput(value)) {
      return
    }

    if (isIntegerInRange(value, MIN_ITEMS, MAX_ITEMS)) {
      setItems((currentItems) => resizeItems(currentItems, Number(value)))
    }
  }

  function handleCapacityChange(event) {
    setCapacity(getOnlyDigits(event.target.value))
    clearOutputs()
  }

  function handleTimeLimitChange(event) {
    setTimeLimitSeconds(getOnlyDigits(event.target.value))
    clearOutputs()
  }

  function handlePriorityChange(nextPriority) {
    setPriority(nextPriority)
    clearOutputs()
  }

  function handleItemChange(index, field, value) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }

        if (field === 'name') {
          return {
            ...item,
            name: value.slice(0, 40),
          }
        }

        return {
          ...item,
          [field]: value,
        }
      }),
    )
    clearOutputs()
  }

  function handleItemBlur(index, field) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index || field === 'name' || isBlankInput(item[field])) {
          return item
        }

        return {
          ...item,
          [field]: clampInputValue(item[field], field === 'weight' ? 1 : 0, 99999, item[field]),
        }
      }),
    )
    clearOutputs()
  }

  function handleGenerateRandomProblem() {
    const randomProblem = generateRandomProblem({ itemCount: items.length })
    setItems(randomProblem.items)
    setItemCountInput(String(randomProblem.items.length))
    setCapacity(randomProblem.capacity)
    setAgentDecision(null)
    setAgentResultExplanation(null)
    setSolution(null)
    setExecutionRequest(null)
    setMessage({
      tipo: 'exito',
      texto: '¡Objetos generados exitosamente!',
    })
  }

  function getInputErrors() {
    const errors = []

    if (!isIntegerInRange(itemCountInput, MIN_ITEMS, MAX_ITEMS)) {
      errors.push(`La cantidad de objetos debe ser un entero entre ${MIN_ITEMS} y ${MAX_ITEMS}.`)
    }

    if (!isIntegerInRange(capacity, MIN_CAPACITY, MAX_CAPACITY)) {
      errors.push(`La capacidad debe ser un entero entre ${MIN_CAPACITY} y ${MAX_CAPACITY}.`)
    }

    if (!isIntegerInRange(timeLimitSeconds, MIN_TIME_LIMIT_SECONDS, MAX_TIME_LIMIT_SECONDS)) {
      errors.push(
        `El tiempo limite debe ser un entero entre ${MIN_TIME_LIMIT_SECONDS} y ${MAX_TIME_LIMIT_SECONDS} segundos.`,
      )
    }

    items.forEach((item, index) => {
      if (!isIntegerInput(item.weight) || Number(item.weight) <= 0) {
        errors.push(`El peso del objeto ${index + 1} debe ser un entero positivo.`)
      }

      if (!isIntegerInput(item.value) || Number(item.value) < 0) {
        errors.push(`El valor del objeto ${index + 1} debe ser un entero no negativo.`)
      }
    })

    return errors
  }

  function getValidatedData() {
    const inputErrors = getInputErrors()

    if (inputErrors.length > 0) {
      return {
        problem: null,
        constraints: null,
        errors: inputErrors,
        isValid: false,
      }
    }

    const problem = buildProblem(items, capacity)
    const constraints = buildConstraints(priority, timeLimitSeconds)
    const problemValidation = validateProblemInput(problem)
    const constraintsValidation = validateConstraints(constraints)
    const errors = [...problemValidation.errors, ...constraintsValidation.errors]

    return {
      problem,
      constraints,
      errors,
      isValid: errors.length === 0,
    }
  }

  async function handleAskAgent() {
    const data = getValidatedData()

    if (!data.isValid) {
      setMessage({
        tipo: 'error',
        texto: data.errors[0],
      })
      return
    }

    setAgentDecision(null)
    setAgentResultExplanation(null)
    setSolution(null)
    setExecutionRequest(null)
    setMessage(createMessage())
    setFrame(FRAMES.LOADING)
    setTransition({
      title: 'Analizando problema',
      detail: 'Consultando al agente.',
      nextFrame: null,
      delayMs: 0,
    })

    try {
      const service = createAgentService(apiKey)
      const request = createAgentRequest(data.problem, data.constraints)
      const decision = await service.decide(request)
      const decisionValidation = validateAgentDecision(decision)

      if (!decisionValidation.isValid) {
        setTransition(null)
        setFrame(FRAMES.SETUP)
        setMessage({
          tipo: 'error',
          texto: decisionValidation.errors[0],
        })
        return
      }

      setAgentDecision(decision)
      setAgentResultExplanation(null)
      setSelectedAlgorithm(decision.selectedAlgorithm)
      setTransition(null)
      setFrame(FRAMES.AGENT_REVIEW)
    } catch (error) {
      setTransition(null)
      setFrame(FRAMES.SETUP)
      setMessage({
        tipo: 'error',
        texto: getAgentErrorMessage(error),
      })
    }
  }

  function handleConfirmAgentExecution() {
    const data = getValidatedData()

    if (!data.isValid) {
      setMessage({
        tipo: 'error',
        texto: data.errors[0],
      })
      setFrame(FRAMES.SETUP)
      return
    }

    if (!agentDecision) {
      setMessage({
        tipo: 'error',
        texto: 'Primero consulte al agente.',
      })
      setFrame(FRAMES.SETUP)
      return
    }

    setExecutionRequest({
      problem: data.problem,
      constraints: data.constraints,
      algorithmId: agentDecision.selectedAlgorithm,
      mode: 'agent',
    })
    setFrame(FRAMES.EXECUTING)
  }

  if (frame === FRAMES.LOGIN) {
    return (
      <LoginScreen
        apiKey={apiKey}
        loginMessage={loginMessage}
        onApiKeyChange={setApiKey}
        onSubmit={handleLoginSubmit}
      />
    )
  }

  if (frame === FRAMES.LOADING) {
    return (
      <LoadingScreen
        detail={transition?.detail || 'Cargando.'}
        title={transition?.title || 'Cargando'}
      />
    )
  }

  if (frame === FRAMES.WELCOME) {
    return (
      <WelcomeFrame
        algorithms={algorithms}
        onLogout={handleLogout}
        onStartAttempt={handleStartAttempt}
        priority={priority}
        runCounter={runCounter}
      />
    )
  }

  if (frame === FRAMES.AGENT_REVIEW) {
    return (
      <AgentReviewFrame
        agentDecision={agentDecision}
        capacity={capacity}
        items={items}
        onBack={handleReturnToSetup}
        onConfirmExecution={handleConfirmAgentExecution}
        priority={priority}
        selectedAlgorithm={selectedAlgorithm}
        timeLimitSeconds={timeLimitSeconds}
        totals={totals}
      />
    )
  }

  if (frame === FRAMES.EXECUTING) {
    return (
      <LoadingScreen
        detail="Procesando solución."
        title="Ejecutando algoritmo"
      />
    )
  }

  if (frame === FRAMES.RESULTS) {
    return (
      <ResultsFrame
        agentDecision={agentDecision}
        agentResultExplanation={agentResultExplanation}
        capacity={capacity}
        executionRequest={executionRequest}
        items={items}
        maxItemValue={maxItemValue}
        message={message}
        onAdjustProblem={handleAdjustProblem}
        onNewAttempt={handleNewAttempt}
        selectedAlgorithmInfo={selectedAlgorithmInfo}
        selectedItemIds={selectedItemIds}
        solution={solution}
      />
    )
  }

  return (
    <ProblemSetupFrame
      capacity={capacity}
      itemCountInput={itemCountInput}
      items={items}
      maxCapacity={MAX_CAPACITY}
      maxItems={MAX_ITEMS}
      maxTimeLimitSeconds={MAX_TIME_LIMIT_SECONDS}
      message={message}
      minCapacity={MIN_CAPACITY}
      minItems={MIN_ITEMS}
      minTimeLimitSeconds={MIN_TIME_LIMIT_SECONDS}
      onAskAgent={handleAskAgent}
      onBack={handleReturnToWelcome}
      onCapacityChange={handleCapacityChange}
      onGenerateRandomProblem={handleGenerateRandomProblem}
      onItemBlur={handleItemBlur}
      onItemChange={handleItemChange}
      onItemCountChange={handleItemCountChange}
      onPriorityChange={handlePriorityChange}
      onTimeLimitChange={handleTimeLimitChange}
      priority={priority}
      timeLimitSeconds={timeLimitSeconds}
      totals={totals}
    />
  )
}

export default App
