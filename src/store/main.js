import { defineStore } from 'pinia'
import { computed, readonly, toRef, watch } from 'vue'
import { useAsyncState, useStorage, until, invoke, pausableWatch } from '@vueuse/core'
import { Network } from '@capacitor/network'
import { DateTime } from 'luxon'
import { Storage } from '@capacitor/storage'
import { useCapacitorStorageState } from '@/lib/useCapacitorStorage'
import { useConnect, useUser, useCrews, usePlanning } from './index.js'
import { importCrewConnectPlanning } from '@/lib/CrewConnect/importCCPlanning.js'
import { toastHttpError } from '@/helpers/toast.js'
import { useServerUrlPrompt } from '@/helpers/alert.js'

const GLOBAL_CONFIG_KEY = 'TOSYNC._GLOBAL_.config'
const LAST_CREWS_INDEX_SYNC_KEY = 'TOSYNC._GLOBAL_.lastCrewsIndexSync'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const GLOBAL_CONFIG_DEFAULTS = {
  theme: prefersDark.matches ? 'dark' : 'light',
  autoConnect: false,
  firstUse: true
}
const NETWORK_STATUS_DEFAULTS = { connecte: false, connectionType: 'unknown' }

export const useMainStore = defineStore('main', () => {
  // state
  const errorRef = ref()

  // sub stores
  const connect = useConnect()
  const crews = useCrews()
  const user = useUser()
  const planning = usePlanning()

  // Global persistent config
  const { state: config, isReady: configIsReady } = useCapacitorStorageState(GLOBAL_CONFIG_KEY, GLOBAL_CONFIG_DEFAULTS)
  const lastCrewsIndexSync = useStorage(LAST_CREWS_INDEX_SYNC_KEY, '')
  
  // Application network state : { connected: boolean, connectionType: string 'wifi' | 'cellular' | 'none' | 'unknown' }
  const { state: networkStatus, isReady: networkStatusIsReady } = useAsyncState(Network.getStatus(), NETWORK_STATUS_DEFAULTS)
  Network.addListener('networkStatusChange', status => {
    console.log('Network status changed', status)
    networkStatus.value = status
  })

  // actions
  const promptForServerUrl = useServerUrlPrompt()
  async function signIn({ silent = false }) {
    pauseAutoLogin()
    console.log('main.signIn', silent)

    // Ensure serverUrl has been defined
    if (!connect.serverUrl) {
      if (silent) {
        resumeAutoLogin()
        return
      }
      const { role, data } = await promptForServerUrl({
        header: 'Adresse du serveur',
        message: 'Entrez l\'adresse du serveur CrewConnect. Une fois renseignée, celle-ci peut être modifiée dans les réglages.',
        value: '',
        placeholder: 'https://adresse.du.serveur'
      })
      if (role === 'confirm' && data?.validatedUrl) {
        connect.serverUrl = data.validatedUrl
      } else {
        resumeAutoLogin()
        return
      }
    }

    try {
      const userId = await connect.signIn(user.userId, { silent })
      if (userId) {
        // Import crews index if needed
        await until(() => crews.isReady).toBe(true)
        const oneWeekAgo = DateTime.utc().minus({ weeks: 1 }).toISO()
        if (!crews.list.length || lastCrewsIndexSync.value <= oneWeekAgo) {
          console.log('[mainStore] Importing latest crews index...',)
          await syncCrewsIndex(false)
        }
        // Load user profile
        if (userId !== user.userId || !user.currentUser) {
          await until(() => crews.isReady).toBe(true)
          const userProfile = crews.get(userId)
          if (!userProfile) {
            throw new Error(`Profil utilisateur « ${userId} » introuvable !`)
          }
          if (userProfile.photoThumbnail) {
            userProfile._attachments = {
              'photo.jpg': {
                content_type: 'image/jpg',
                data: await connect.getCrewPhoto(userProfile.photoThumbnail, { format: 'blob' })
              }
            }
          }
          
          await user.addUser(userProfile)
          user.setUser(userProfile)
        }
        // Trigger after connect actions
        await onCrewConnectLogin()
      }
    } catch (error) {
      toastHttpError(error)
      errorRef.value = error
    } finally {
      resumeAutoLogin()
    }
  }

  function toggleTheme() {
    if (config.value.theme === 'light') {
      config.value.theme = 'dark'
    } else if (config.value.theme === 'dark') {
      config.value.theme = 'light'
    }
    console.log('main.toggleTheme', config.value)
  }

  // Watchers
  const { pause: pauseAutoLogin, resume: resumeAutoLogin } = pausableWatch(
    () => configIsReady.value && networkStatus.value.connected && user.userId && connect.serverUrl,
    async ready => {
      if (ready && config.value.autoConnect) {
        await signIn({ silent: true })
      }
    }
  )

  // helpers
  async function onCrewConnectLogin() {
    console.log('main.onCrewConnectLogin')
    await until(() => user.isReady).toBe(true)
    const fiveMinutesAgo = DateTime.utc().minus({ minutes: 5 }).toISO()
    if (user.config.lastPlanningSync <= fiveMinutesAgo) {
      // const { success, results } = await syncPlanning()
      // if (success) {
      //   console.log('main.syncPlanning success', results)
      //   user.config.lastPlanningSync = DateTime.utc().toISO()
      // } else {
      //   console.log('main.syncPlanning error', results)
      // }
    }
  }

  async function syncCrewsIndex(toastOnError = true) {
    try {
      const crewsList = await connect.getCrewsIndex()
      console.log('main.syncCrewsIndex', crewsList)
      await crews.importList(crewsList, { overwriteTitles: true })
      lastCrewsIndexSync.value = DateTime.utc().toISO()
    } catch (error) {
      console.log('main.syncCrewsIndex error', error)
      errorRef.value = error
      if (toastOnError) {
        toastHttpError(error)
      }
    }
  }

  async function syncPlanning() {
    const rosterData = await connect.getLatestRosterCalendars(user.config.lastPlanningSync)
    const result = await planning.importCrewConnectData(rosterData)
    console.log(result)
    return result
  }

  async function syncPlanningInterval({ dateFrom, dateTo }) {
    const rosterData = await connect.getRosterCalendars({ dateFrom, dateTo })
    const result = await planning.importCrewConnectData(rosterData)
    console.log(result)
    return result
  }

  async function signOut() {
    pauseAutoLogin()
    try {
      if (connect.isConnected) {
        await connect.signOut()
      }
      user.logout()
    } catch (error) {
      errorRef.value = error
      toastHttpError(error)
    } finally {
      resumeAutoLogin()
    }
  }


  return {
    config,
    error: errorRef,
    network: readonly(networkStatus),
    lastCrewsIndexSync: readonly(lastCrewsIndexSync),
    lastPlanningSync: computed(() => user.config.lastPlanningSync),
    isDark: computed(() => config.value.theme === 'dark'),
    toggleTheme,
    signIn,
    signOut,
    syncPlanning,
    syncPlanningInterval,
    syncCrewsIndex,
    isReady: computed(() => configIsReady.value && networkStatusIsReady.value)
  }
})
