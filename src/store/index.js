import { defineStore } from 'pinia'
import { watch } from 'vue'
import { Storage } from '@capacitor/storage'

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

    async init() {
      try {
        const { value } = await Storage.get({ key: USER_ID_KEY })
        this.userId = value
        console.log('userId', value)
      } catch (err) {
        console.error('Couldn\'t retrieve userId.')
      }
      watch(
        () => this.userId,
        async userId => {
          try {
            await Storage.set({
              key: USER_ID_KEY,
              value: userId
            })
          } catch (err) {
            console.error('Couldn\'t save userId.')
          }
        }
      )

      try {
        const { value } = await Storage.get({ key: CONFIG_KEY })
        this.config = JSON.parse(value)
        console.log('CONFIG', this.config)
      } catch (err) {
        console.error('Couldn\'t retrieve config.')
      }
      watch(
        () => this.config,
        async config => {
          try {
            await Storage.set({
              key: CONFIG_KEY,
              value: JSON.stringify(config)
            })
          } catch (err) {
            console.error('Couldn\'t save config.')
          }
        },
        { deep: true }
      )

      if (!Object.prototype.hasOwnProperty.call(this.config, 'theme')) {
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
