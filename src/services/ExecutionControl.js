/**
 * Controla si una ejecucion local debe detenerse por limite de tiempo.
 */
export class ExecutionControl {
  /**
   * @param {{ timeLimitMs?: number, checkInterval?: number }} [options]
   */
  constructor(options = {}) {
    const timeLimitMs = Number(options.timeLimitMs || 0)
    const checkInterval = Number(options.checkInterval || 512)

    this.timeLimitMs = Number.isFinite(timeLimitMs) && timeLimitMs > 0 ? timeLimitMs : 0
    this.checkInterval =
      Number.isInteger(checkInterval) && checkInterval > 0 ? checkInterval : 512
    this.startedAt = this.getNow()
    this.checkCount = 0
    this.wasInterrupted = false
  }

  /**
   * @returns {boolean}
   */
  hasTimeLimit() {
    return this.timeLimitMs > 0
  }

  /**
   * Revisa si se alcanzo el limite de tiempo.
   *
   * @param {boolean} [force]
   * @returns {boolean}
   */
  shouldStop(force = false) {
    if (!this.hasTimeLimit()) {
      return false
    }

    this.checkCount += 1

    if (!force && this.checkCount % this.checkInterval !== 0) {
      return this.wasInterrupted
    }

    if (this.getElapsedTimeMs() >= this.timeLimitMs) {
      this.wasInterrupted = true
    }

    return this.wasInterrupted
  }

  /**
   * @returns {number}
   */
  getElapsedTimeMs() {
    return this.getNow() - this.startedAt
  }

  /**
   * @returns {number}
   */
  getTimeLimitMs() {
    return this.timeLimitMs
  }

  /**
   * @returns {number}
   */
  getNow() {
    if (globalThis.performance && typeof globalThis.performance.now === 'function') {
      return globalThis.performance.now()
    }

    return Date.now()
  }
}

