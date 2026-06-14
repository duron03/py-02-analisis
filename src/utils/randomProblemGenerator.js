/**
 * Genera un entero aleatorio entre minimo y maximo.
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Genera objetos aleatorios para el problema.
 *
 * @param {{ count: number, minWeight?: number, maxWeight?: number, minValue?: number, maxValue?: number }} options
 * @returns {object[]}
 */
export function generateRandomItems(options) {
  const minWeight = options.minWeight || 1
  const maxWeight = options.maxWeight || 20
  const minValue = options.minValue || 1
  const maxValue = options.maxValue || 100

  return Array.from({ length: options.count }, (_, index) => ({
    id: index + 1,
    name: `Objeto ${index + 1}`,
    weight: getRandomInteger(minWeight, maxWeight),
    value: getRandomInteger(minValue, maxValue),
  }))
}

/**
 * Genera un problema completo aleatorio.
 *
 * @param {{ itemCount?: number, capacity?: number }} options
 * @returns {{ items: object[], capacity: number }}
 */
export function generateRandomProblem(options = {}) {
  const itemCount = options.itemCount || 6
  const items = generateRandomItems({ count: itemCount })
  const totalWeight = items.reduce((total, item) => total + item.weight, 0)
  const capacity = options.capacity || Math.max(1, Math.floor(totalWeight * 0.45))

  return {
    items,
    capacity,
  }
}

