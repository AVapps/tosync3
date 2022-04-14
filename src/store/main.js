import { defineStore } from 'pinia'
import { computed, readonly, toRef } from 'vue'
import { useAsyncState, until, invoke } from '@vueuse/core'
import { Network } from '@capacitor/network'
import { DateTime } from 'luxon'
import { Storage } from '@capacitor/storage'
import { useCapacitorStorage } from '@/lib/useCapacitorStorage'
import { useConnect, useUser, useCrews } from './index.js'

const GLOBAL_CONFIG_KEY = 'TOSYNC._GLOBAL_.config'
const LAST_CREWS_INDEX_SYNC_KEY = 'TOSYNC._GLOBAL_.lastCrewsIndexSync'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const GLOBAL_CONFIG_DEFAULTS = {
  theme: prefersDark.matches ? 'dark' : 'light'
}

export const useMainStore = defineStore('main', () => {
  // Other stores
  const connect = useConnect()
  const crews = useCrews()

  // Global persistent config
  const config = useCapacitorStorage(GLOBAL_CONFIG_KEY, GLOBAL_CONFIG_DEFAULTS)

  const lastCrewsIndexSync = useCapacitorStorage(LAST_CREWS_INDEX_SYNC_KEY, '')
  
  // Application network state : { connected: boolean, connectionType: string 'wifi' | 'cellular' | 'none' | 'unknown' }
  const { state: networkStatus } = useAsyncState(Network.getStatus())
  Network.addListener('networkStatusChange', status => {
    console.log('Network status changed', status)
    networkStatus.value = status
  })

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
    const connectedAndReady = computed(() => crews.isReady && connect.isConnected && networkStatus.value.connected)
    
    await until(connectedAndReady).toBe(true)
    console.log('Connected and ready : loading')

    const { value: lastSync } = await Storage.get({ key: LAST_CREWS_INDEX_SYNC_KEY })
    const oneWeekAgo = DateTime.utc().minus({ days: 7 }).toISO()

    console.log('crews.lastSync', lastSync)

    if (lastSync <= oneWeekAgo) {
      try {
        const crewsList = await connect.getCrewsIndex()
        console.log('main.syncCrewsIndex', crewsList)
        await crews.importList(crewsList, { overwriteTitles: true })
        lastCrewsIndexSync.value = DateTime.utc().toISO()
      } catch (error){
        console.error('main.syncCrewsIndex error', error)
      }
    }
  })


  return {
    config,
    toggleTheme,
    network: readonly(networkStatus),
    lastCrewsIndexSync: readonly(lastCrewsIndexSync)
  }
})
