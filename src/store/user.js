import { defineStore } from 'pinia'
import { ref, reactive, readonly, computed, watch } from 'vue'
import { useCapacitorStorage, useCapacitorStorageState } from '@/lib/useCapacitorStorage'
import { reactiveComputed, toReactive, until, whenever } from '@vueuse/core'
import { UsersCollection } from '@/model/Users'
import { useTask } from 'vue-concurrency'
import { toastError } from '@/helpers/toast'

const TOSYNC_PREFIX = 'TOSYNC'
const USER_ID_KEY = `${TOSYNC_PREFIX}.userId`
const USER_PROFILE_KEY = 'profile'
const USER_CONFIG_KEY = 'config'

const USER_PROFILE_DEFAULTS = {
  _id: '',
  fonction: 'OPL',
  categorie: 'A',
  dateAnciennete: '2021-01-01',
  classe: 5,
  atpl: false,
  eHS: 'AF'
}

const USER_CONFIG_DEFAULTS = {
  lastPlanningSync: '2021-01-01T00:00:00.000Z',
  syncCalendarsOptions: [],
  icalendarOptions: {
    tags: [ 'vol', 'repos', 'conges', 'instruction', 'sol' ]
  }
}

// User Store
export const useUser = defineStore('user', () => {
  const db = new UsersCollection()
  const usersList = ref([])

  const loadUsersTask = useTask(function* () {
    usersList.value = yield db.getAll()
    return usersList.value
  }).drop()

  const firstTask = loadUsersTask.perform()

  const usersMap = computed(() => new Map(usersList.value.map(doc => [ doc._id, doc ])))

  const { state: userId, isReady: userIdIsReady, isLoading: userIdIsLoading } = useCapacitorStorageState(USER_ID_KEY, '')

  const { state: userProfile, isReady: userProfileIsReady, isLoading: userProfileIsloading } = useCapacitorStorageState(
    computed(() => `${TOSYNC_PREFIX}.${userId.value || 'DEFAULTS'}.${USER_PROFILE_KEY}`),
    USER_PROFILE_DEFAULTS
  )

  const { state: userConfig, isReady: userConfigIsReady, isLoading: userConfigIsLoading } = useCapacitorStorageState(
    computed(() => `${TOSYNC_PREFIX}.${userId.value || 'DEFAULTS'}.${USER_CONFIG_KEY}`),
    USER_CONFIG_DEFAULTS
  )

  async function addUser(user) {
    console.log('ADD USER', user)
    if (usersMap.value.has(user._id)) {
      user._rev = usersMap.value.get(user._id)._rev
    }
    await db.upsert(user)
    await loadUsersTask.perform()
  }

  function setUser({ _id }) {
    console.log('SET USER', _id)
    if (!usersMap.value.has(_id)) {
      throw new Error('Utilisateur introuvable !')
    }
    userId.value = _id
  }

  const currentUser = computed(() => usersMap.value.get(userId.value))

  const isPNT = computed(() => {
    return /CDB|OPL/.test(currentUser.value.contractRoles)
  })

  function logout() {
    userId.value = null
  }

  return {
    db,
    isReady: computed(() => userIdIsReady.value && firstTask.isSuccessful && userProfileIsReady.value && userConfigIsReady.value),
    isLoading: computed(() => userIdIsLoading.value && loadUsersTask.isRunning && userProfileIsloading.value && userConfigIsLoading.value),
    userId: readonly(userId),
    currentUser,
    isPNT,
    profile: userProfile,
    config: userConfig,
    addUser,
    setUser,
    logout,
    usersList,
    usersMap
  }
})
