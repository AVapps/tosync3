const EVENTS_KEY = Symbol('events')
export class SimpleEventEmitter {
  constructor() {
    this[EVENTS_KEY] = new Map()
  }

  on(name, listener) {
    if (!this[EVENTS_KEY].has(name)) {
      this[EVENTS_KEY].set(name, [])
    }
    this[EVENTS_KEY].get(name).push(listener)
  }

  removeListener(name, listenerToRemove) {
    if (!this[EVENTS_KEY].has(name)) {
      throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`)
    }
    const filterListeners = (listener) => listener !== listenerToRemove
    this[EVENTS_KEY].set(name, this[EVENTS_KEY].get(name).filter(filterListeners))
  }

  emit(name, data) {
    if (!this[EVENTS_KEY].has(name)) {
      return
    }
    const fireCallbacks = (callback) => {
      callback(data)
    }
    this[EVENTS_KEY].get(name).forEach(fireCallbacks)
  }
}
