/**
 * Cronometro pequeno para medir tiempo real en milisegundos.
 */
export class PerformanceTimer {
  constructor() {
    this.startedAt = 0
    this.endedAt = 0
  }

  /**
   * Inicia la medicion.
   */
  start() {
    this.startedAt = this.getNow()
    this.endedAt = 0
  }

  /**
   * Detiene la medicion.
   *
   * @returns {number}
   */
  stop() {
    this.endedAt = this.getNow()
    return this.getElapsedTime()
  }

  /**
   * @returns {number}
   */
  getElapsedTime() {
    const end = this.endedAt || this.getNow()
    return Number((end - this.startedAt).toFixed(3))
  }

  /**
   * Usa performance.now si esta disponible.
   *
   * @returns {number}
   */
  getNow() {
    if (globalThis.performance && typeof globalThis.performance.now === 'function') {
      return globalThis.performance.now()
    }

    return Date.now()
  }
}

