import { defineStore } from 'pinia'
import { watch } from 'vue'
import { Storage } from '@capacitor/storage'

const USER_ID_KEY = 'tosync.userId'
const USER_PREFIX = 'tosync.user'
const CONFIG_KEY = 'tosync.config'

const USER_DEFAULTS = {
  fonction: 'OPL',
  categorie: 'A',
  dateAnciennete: '2021-01-01',
  classe: 5,
  atpl: false,
  eHS: 'AF'
}

export const useMainStore = defineStore({
  // name of the store
  // it is used in devtools and allows restoring state
  id: 'main',
  // a function that returns a fresh state
  state: () => ({
    userId: null,
    user: null,
    config: {
      profile: {
        fonction: 'OPL',
        categorie: 'A',
        dateAnciennete: '2021-01-01',
        classe: 5,
        atpl: false,
        eHS: 'AF'
      },
      syncCalendars: [],
      syncCalendarsOptions: {}
    }
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

    async loginUserId(userId, save = true) {
      if (userId && userId !== this.userId) {
        this.userId = userId

        if (save) {
          await Storage.set({
            key: USER_ID_KEY,
            value: userId
          })
        }
        console.log('User logged in !', userId)

        const userKey = [USER_PREFIX, userId].join('.')
        const { value } = await Storage.get({ key: userKey })
        this.user = JSON.parse(value) || USER_DEFAULTS
        console.log('User loaded :', this.user)
        return this.user
      }
    },

    async logout() {
      await Storage.set({
        key: USER_ID_KEY,
        value: null
      })
      this.userId = null
      this.user = {}
      console.log('User logged out !')
    },

    async init() {
      try {
        const { value } = await Storage.get({ key: USER_ID_KEY })
        console.log('store.init userId', value)
        if (value) {
          console.log('Previous user session found !', value)
          await this.loginUserId(value, false)
        }
      } catch (err) {
        console.log('Couldn\'t retrieve userId.')
      }

      // Watch user for change to store
      watch(
        () => this.user,
        async user => {
          if (this.userId) {
            try {
              console.log('USER changed', this.userId, user)
              const userKey = [USER_PREFIX, this.userId].join('.')
              await Storage.set({
                key: userKey,
                value: JSON.stringify(user)
              })
            } catch (err) {
              console.log('Couldn\'t save user.')
            }
          }
        },
        { deep: true }
      )

      try {
        const { value } = await Storage.get({ key: CONFIG_KEY })
        this.config = JSON.parse(value) || {}
        console.log('CONFIG', this.config)
      } catch (err) {
        console.log('Couldn\'t retrieve config.')
      }

      // Watch for config change
      watch(
        () => this.config,
        async config => {
          try {
            console.log('CONFIG changed', this.config)
            await Storage.set({
              key: CONFIG_KEY,
              value: JSON.stringify(config)
            })
          } catch (err) {
            console.log('Couldn\'t save config.')
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
