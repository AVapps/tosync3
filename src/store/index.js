import { defineStore } from 'pinia'
import { watch } from 'vue'

const USER_ID_KEY = 'tosync.userId'
const CONFIG_KEY = 'tosync.config'

export const useMainStore = defineStore({
  // name of the store
  // it is used in devtools and allows restoring state
  id: 'main',
  // a function that returns a fresh state
  state: () => ({
    userId: null,
    config: {}
  }),
  // optional getters
  getters: {
    
  },
  // optional actions
  actions: {
    setUserId(userId) {
      // `this` is the store instance
      this.userId = userId
    },

    init() {
      this.userId = localStorage.getItem(USER_ID_KEY)
      watch(
        () => this.userId,
        userId => localStorage.setItem(USER_ID_KEY, userId)
      )

      const config = localStorage.getItem(CONFIG_KEY)
      if (config) {
        this.config = JSON.parse(config)
      }
      watch(
        () => this.config,
        config => localStorage.setItem(CONFIG_KEY, JSON.stringify(config)),
        { deep: true }
      )
      if (!this.config.hasOwnProperty('theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
        this.config.theme = prefersDark.matches ? 'dark' : 'light'
      }
    },

    toggleTheme() {
      if (this.config.theme === 'light') {
        this.config.theme = 'dark'
      } else if (this.config.theme === 'dark') {
        this.config.theme = 'light'
      }
    }
  }
})