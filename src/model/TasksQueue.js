export class AsyncTask {
  constructor(promise, action) {
    this.promise = promise
    this.action = action
  }
}

const tasksKey = Symbol('tasks')
export class Queue {
  constructor() {
    this[tasksKey] = []
  }

  async enqueue(task) {
    this[tasksKey].push(task)
  }

  dequeue() {
    return this[tasksKey].shift()
  }

  get size() {
    return this[tasksKey].length
  }
}

export class AsyncTasksQueue extends Queue {
  constructor() {
    super()
    this._pendingPromise = false
  }

  async enqueue(action) {
    return new Promise((resolve, reject) => {
      super.enqueue({ action, resolve, reject })
      this.dequeue()
    })
  }

  async dequeue() {
    if (this._pendingPromise) return false
    const task = super.dequeue()
    if (!task) return false

    try {
      this._pendingPromise = true
      const payload = await task.action()
      this._pendingPromise = false
      task.resolve(payload)
    } catch (e) {
      this._pendingPromise = false
      task.reject(e)
    } finally {
      this.dequeue()
    }
    return true
  }
}
