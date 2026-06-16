/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasNumericValue(value) {
  return value !== '' && value !== null && value !== undefined
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isIntegerValue(value) {
  return hasNumericValue(value) && Number.isInteger(Number(value))
}

/**
 * Valida una entrada plana del problema.
 *
 * @param {object} problemInput
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateProblemInput(problemInput) {
  const errors = []

  if (!problemInput || typeof problemInput !== 'object') {
    return {
      isValid: false,
      errors: ['El problema debe ser un objeto.'],
    }
  }

  if (!isIntegerValue(problemInput.capacity) || Number(problemInput.capacity) <= 0) {
    errors.push('La capacidad debe ser un entero positivo.')
  }

  if (!Array.isArray(problemInput.items) || problemInput.items.length === 0) {
    errors.push('Debe ingresar al menos un objeto.')
  } else {
    problemInput.items.forEach((item, index) => {
      if (!isIntegerValue(item.weight) || Number(item.weight) <= 0) {
        errors.push(`El peso del objeto ${index + 1} debe ser un entero positivo.`)
      }

      if (!isIntegerValue(item.value) || Number(item.value) < 0) {
        errors.push(`El valor del objeto ${index + 1} debe ser un entero no negativo.`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Valida restricciones de negocio basicas.
 *
 * @param {object} constraints
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateConstraints(constraints) {
  const errors = []
  const allowedPriorities = ['accuracy', 'speed']

  if (!allowedPriorities.includes(constraints.priority)) {
    errors.push('La prioridad debe ser accuracy o speed.')
  }

  if (
    !hasNumericValue(constraints.timeLimitSeconds) ||
    !Number.isFinite(Number(constraints.timeLimitSeconds)) ||
    Number(constraints.timeLimitSeconds) <= 0
  ) {
    errors.push('El tiempo limite debe ser mayor que cero.')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
