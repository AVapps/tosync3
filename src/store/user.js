import { defineStore } from 'pinia'
import { ref, reactive, readonly, watch, computed } from 'vue'
import { Storage } from '@capacitor/storage'
import { useCapacitorStorage } from '@/lib/useCapacitorStorage'
import { useAsyncState, toReactive } from '@vueuse/core'
import { checkUserId } from '@/helpers/check'

const TOSYNC_PREFIX = 'TOSYNC'
const USER_ID_KEY = `${TOSYNC_PREFIX}.userId`
const USER_PREFIX = 'tosync.user'
const CONFIG_KEY = 'tosync.config'

const USER_PROFILE_KEY = 'profile'
const USER_CONFIG_KEY = 'config'

const USER_PROFILE_DEFAULTS = {
  _id: '',
  title: '',
  contractRoles: '',
  firstName: '',
  lastName: '',
  fonction: 'OPL',
  categorie: 'A',
  dateAnciennete: '2021-01-01',
  classe: 5,
  atpl: false,
  eHS: 'AF'
}

const USER_CONFIG_DEFAULTS = {
  syncCalendarsOptions: [],
  icalendarOptions: {
    tags: [ 'vol', 'repos', 'conges', 'instruction', 'sol' ]
  }
}

function getUserProfileKey(userId) {
  return `${TOSYNC_PREFIX}.${userId}.${USER_PROFILE_KEY}`
}

function getUserConfigKey(userId) {
  return `${TOSYNC_PREFIX}.${userId}.${USER_CONFIG_KEY}`
}

export const useUser = defineStore('user', () => {

  const { state: userId, isReady } = useAsyncState(async () => {
    const { value } = await Storage.get({ key: USER_ID_KEY })
    console.log('FOUND userID', value)
    return /^[A-Z]{3}$/.test(value) ? value : ''
  }, '')

  const profile = computed(() => {
    if (userId.value) {
      return useCapacitorStorage(getUserProfileKey(userId.value), USER_PROFILE_DEFAULTS)
    }
    return USER_PROFILE_DEFAULTS
  })

  const config = computed(() => {
    if (userId.value) {
      return useCapacitorStorage(getUserConfigKey(userId.value), USER_CONFIG_DEFAULTS)
    }
    return USER_CONFIG_DEFAULTS
  })

  function setUserId(crewCode) {
    checkUserId(crewCode)
    userId.value = crewCode
    Storage.set({ key: USER_ID_KEY, value: crewCode }).catch(e => console.log(e))
  }

  const isPNT = computed(() => {
    return /CDB|OPL/.test(profile.value.contractRoles)
  })

  function logout() {
    setUserId('')
  }

  return {
    isReady: readonly(isReady),
    userId: readonly(userId),
    profile: toReactive(profile),
    config: toReactive(config),
    isPNT,
    setUserId,
    logout
  }
})
