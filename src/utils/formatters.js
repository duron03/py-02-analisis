/**
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatMilliseconds(milliseconds) {
  return `${Number(milliseconds).toFixed(3)} ms`
}

/**
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  return Number(value).toLocaleString('es-CR')
}

/**
 * @param {string} algorithmId
 * @returns {string}
 */
export function formatAlgorithmName(algorithmId) {
  const names = {
    backtracking: 'Backtracking',
    'dynamic-programming': 'Programacion Dinamica',
    greedy: 'Greedy por densidad',
  }

  return names[algorithmId] || algorithmId
}

/**
 * @param {string} priority
 * @returns {string}
 */
export function formatPriority(priority) {
  if (priority === 'accuracy') {
    return 'Maxima Exactitud'
  }

  if (priority === 'speed') {
    return 'Velocidad Maxima'
  }

  return priority
}

