export class Queue {
  #tasks

  constructor() {
    this.#tasks = []
  }

  enqueue(item) {
    this.#tasks.push(item)
  }

  dequeue() {
    return this.#tasks.shift()
  }

  get size() {
    return this.#tasks.length
  }
}

export class AutoQueue extends Queue {
  constructor() {
    super()
    this._pendingPromise = false
  }

  enqueue(action) {
    return new Promise((resolve, reject) => {
      super.enqueue({ action, resolve, reject })
      this.dequeue()
    })
  }

  async dequeue() {
    if (this._pendingPromise) return false

    const item = super.dequeue()

    if (!item) return false

    try {
      this._pendingPromise = true

      const payload = await item.action(this)

      this._pendingPromise = false
      item.resolve(payload)
    } catch (e) {
      this._pendingPromise = false
      item.reject(e)
    } finally {
      this.dequeue()
    }

    return true
  }
}
