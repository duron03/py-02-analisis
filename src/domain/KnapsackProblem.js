import { Item } from './Item.js'

/**
 * Representa una instancia del problema de la mochila 0/1.
 */
export class KnapsackProblem {
  /**
   * @param {{ items: Array<Item|object>, capacity: number }} data
   */
  constructor(data) {
    this.items = (data.items || []).map((item) =>
      item instanceof Item ? item.clone() : new Item(item),
    )
    this.capacity = Number(data.capacity)
  }

  /**
   * Valida las reglas basicas del problema.
   *
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validate() {
    const errors = []

    if (!Number.isInteger(this.capacity) || this.capacity <= 0) {
      errors.push('La capacidad debe ser un entero positivo.')
    }

    if (!Array.isArray(this.items) || this.items.length === 0) {
      errors.push('Debe existir al menos un objeto.')
    }

    this.items.forEach((item, index) => {
      if (!item.isValid()) {
        errors.push(`El objeto en la posicion ${index + 1} no es valido.`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * @returns {number}
   */
  getItemCount() {
    return this.items.length
  }

  /**
   * @returns {KnapsackProblem}
   */
  clone() {
    return new KnapsackProblem(this.toPlainObject())
  }

  /**
   * @returns {{ items: object[], capacity: number }}
   */
  toPlainObject() {
    return {
      items: this.items.map((item) => item.toPlainObject()),
      capacity: this.capacity,
    }
  }
}

