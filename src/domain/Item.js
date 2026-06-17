/**
 * Representa un objeto candidato para la mochila.
 */
export class Item {
  /**
   * @param {{ id: number|string, name?: string, weight: number, value: number }} data
   */
  constructor(data) {
    this.id = data.id
    this.name = data.name || `Objeto ${data.id}`
    this.weight = Number(data.weight)
    this.value = Number(data.value)
  }

  /**
   * Calcula la densidad de valor del objeto.
   *
   * @returns {number}
   */
  getDensity() {
    if (this.weight <= 0) {
      return 0
    }

    return this.value / this.weight
  }

  /**
   * Verifica que el objeto tenga datos utilizables para mochila 0/1.
   *
   * @returns {boolean}
   */
  isValid() {
    return (
      this.id !== undefined &&
      this.id !== null &&
      this.name.trim().length > 0 &&
      Number.isInteger(this.weight) &&
      Number.isInteger(this.value) &&
      this.weight > 0 &&
      this.value >= 0
    )
  }

  /**
   * Crea una copia simple del objeto.
   *
   * @returns {Item}
   */
  clone() {
    return new Item(this.toPlainObject())
  }

  /**
   * Devuelve una version plana para mostrar o enviar por contratos.
   *
   * @returns {{ id: number|string, name: string, weight: number, value: number, density: number }}
   */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      weight: this.weight,
      value: this.value,
      density: this.getDensity(),
    }
  }
}

