export class Deferred {
  constructor() {
    this._state = 'pending'
    this._progressListeners = []
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._resolve = reject
    })
    this._promise.then(
      () => { this._state = 'fulfilled' },
      () => { this._state = 'rejected' }
    )
  }

  resolve(...args) {
    this._resolve(...args)
    return this
  }

  reject(...args) {
    this._reject(...args)
    return this
  }

  then(success, fail, progress) {
    this.onProgress(progress)
    return this._promise.then(success, fail)
  }

  notify(...args) {
    if (!this.isPending) return
    const fireListeners = (listener) => {
      listener(...args)
    }
    this._progressListeners.forEach(fireListeners)
    return this
  }

  onProgress(listener) {
    this._progressListeners.push(listener)
    return this
  }

  removeProgressListener(listenerToRemove) {
    const filterListeners = (listener) => listener !== listenerToRemove
    this._progressListeners = this._progressListeners.filter(filterListeners)
    return this
  }

  get promise() {
    return this._promise
  }

  get state() {
    return this._state
  }

  get isResolved() {
    return this.state === 'fulfilled'
  }

  get isRejected() {
    return this.state === 'rejected'
  }

  get isPending() {
    return this.state === 'pending'
  }
}
