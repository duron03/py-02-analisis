/**
 * Representa el resultado uniforme de un algoritmo de mochila.
 */
export class KnapsackSolution {
  /**
   * @param {{
   *   selectedItems: Array<object>,
   *   algorithmName: string,
   *   algorithmId: string,
   *   executionTimeMs: number,
   *   operationCount: number,
   *   isOptimal: boolean
   * }} data
   */
  constructor(data) {
    this.selectedItems = data.selectedItems || []
    this.algorithmName = data.algorithmName
    this.algorithmId = data.algorithmId
    this.executionTimeMs = data.executionTimeMs || 0
    this.operationCount = data.operationCount || 0
    this.isOptimal = Boolean(data.isOptimal)
    this.calculateTotals()
  }

  /**
   * Calcula peso y valor total desde los objetos seleccionados.
   */
  calculateTotals() {
    this.totalWeight = this.selectedItems.reduce(
      (total, item) => total + Number(item.weight),
      0,
    )
    this.totalValue = this.selectedItems.reduce(
      (total, item) => total + Number(item.value),
      0,
    )
  }

  /**
   * @returns {{
   *   algorithmName: string,
   *   algorithmId: string,
   *   selectedItems: object[],
   *   totalWeight: number,
   *   totalValue: number,
   *   executionTimeMs: number,
   *   operationCount: number,
   *   isOptimal: boolean
   * }}
   */
  toPlainObject() {
    return {
      algorithmName: this.algorithmName,
      algorithmId: this.algorithmId,
      selectedItems: this.selectedItems.map((item) =>
        typeof item.toPlainObject === 'function' ? item.toPlainObject() : item,
      ),
      totalWeight: this.totalWeight,
      totalValue: this.totalValue,
      executionTimeMs: this.executionTimeMs,
      operationCount: this.operationCount,
      isOptimal: this.isOptimal,
    }
  }
}

