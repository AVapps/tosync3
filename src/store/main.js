import { defineStore } from 'pinia'
import { computed, readonly, toRef, watch } from 'vue'
import { useAsyncState, useStorage, until, invoke } from '@vueuse/core'
import { Network } from '@capacitor/network'
import { DateTime } from 'luxon'
import { Storage } from '@capacitor/storage'
import { useCapacitorStorageState } from '@/lib/useCapacitorStorage'
import { useConnect, useUser, useCrews, usePlanning } from './index.js'
import { importCrewConnectPlanning } from '@/lib/CrewConnect/importCCPlanning.js'

const GLOBAL_CONFIG_KEY = 'TOSYNC._GLOBAL_.config'
const LAST_CREWS_INDEX_SYNC_KEY = 'TOSYNC._GLOBAL_.lastCrewsIndexSync'
const FIRST_USE_KEY = 'TOSYNC._GLOBAL_.firstUse'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const GLOBAL_CONFIG_DEFAULTS = {
  theme: prefersDark.matches ? 'dark' : 'light'
}
const NETWORK_STATUS_DEFAULTS = { connecte: false, connectionType: 'unknown' }

export const useMainStore = defineStore('main', () => {
  // sub stores
  const connect = useConnect()
  const crews = useCrews()
  const user = useUser()
  const planning = usePlanning()

  // Global persistent config
  const { state: config, isReady: configIsReady } = useCapacitorStorageState(GLOBAL_CONFIG_KEY, GLOBAL_CONFIG_DEFAULTS)
  const lastCrewsIndexSync = useStorage(LAST_CREWS_INDEX_SYNC_KEY, '')
  const { state: firstUse, isReady: firstUseIsReady } = useCapacitorStorageState(FIRST_USE_KEY, true)
  
  // Application network state : { connected: boolean, connectionType: string 'wifi' | 'cellular' | 'none' | 'unknown' }
  const { state: networkStatus, isReady: networkStatusIsReady } = useAsyncState(Network.getStatus(), NETWORK_STATUS_DEFAULTS)
  Network.addListener('networkStatusChange', status => {
    console.log('Network status changed', status)
    networkStatus.value = status
  })

  // actions
  async function signIn({ silent = false }) {
    console.log('main.signIn', silent)
    const userId = await connect.signIn(user.userId, { silent })
    if (userId) {
      if (userId !== user.userId) {
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
      await onCrewConnectLogin()
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
  invoke(async () => {
    await until(() => crews.isReady && connect.isConnected && networkStatus.value.connected).toBe(true)
    console.log('Connected and ready : loading crews')
 
    const oneWeekAgo = DateTime.utc().minus({ weeks: 1 }).toISO()

    console.log('crews.lastCrewIndexSync', lastCrewsIndexSync.value, oneWeekAgo)

    if (lastCrewsIndexSync.value <= oneWeekAgo) {
      try {
        const crewsList = await connect.getCrewsIndex()
        console.log('main.syncCrewsIndex', crewsList)
        await crews.importList(crewsList, { overwriteTitles: true })
        lastCrewsIndexSync.value = DateTime.utc().toISO()
      } catch (error) {
        console.error('main.syncCrewsIndex error', error)
      }
    }
  })

  watch(() => networkStatus.value.connected && user.userId && connect.serverUrl, async ready => {
    if (ready) {
      try {
        await signIn({ silent: true })
      } catch (e) {
        console.log('main.tryAutoRelogin error', e)
      }
    }
  })

  // helpers
  async function onCrewConnectLogin() {
    console.log('main.onCrewConnectLogin')
    const oneMinuteAgo = DateTime.utc().minus({ seconds: 60 }).toISO()
    await until(() => user.isReady).toBe(true)
    if (user.config.lastPlanningSync <= oneMinuteAgo) {
      const { success, results } = await syncPlanning()
      if (success) {
        console.log('main.syncPlanning success', results)
        user.config.lastPlanningSync = DateTime.utc().toISO()
      } else {
        console.log('main.syncPlanning error', results)
      }
    }
  }

  async function syncPlanning() {
    const data = await connect.getLatestRosterCalendars(user.config.lastPlanningSync)
    const result = await planning.importCrewConnectData(data)
    return result
  }

  async function signOut() {
    if (connect.isConnected) {
      await connect.signOut()
    }
    user.logout()
  }


  return {
    config,
    network: readonly(networkStatus),
    lastCrewsIndexSync: readonly(lastCrewsIndexSync),
    firstUse,
    lastPlanningSync: computed(() => user.config.lastPlanningSync),
    isDark: computed(() => config.value.theme === 'dark'),
    toggleTheme,
    signIn,
    signOut,
    syncPlanning,
    isReady: computed(() => configIsReady.value && networkStatusIsReady.value && firstUseIsReady.value)
  }
})
