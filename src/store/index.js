import { defineStore } from 'pinia'

export const useMainStore = defineStore({
  // name of the store
  // it is used in devtools and allows restoring state
  id: 'main',
  // a function that returns a fresh state
  state: () => ({
    userId: null
  }),
  // optional getters
  getters: {
    
  },
  // optional actions
  actions: {
    setUserId(userId) {
      // `this` is the store instance
      this.userId = userId
    }
  }
})