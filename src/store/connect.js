import { defineStore } from 'pinia'
import { reactive, computed, toRaw, toRefs, watch } from 'vue'
import { CrewConnect } from '@/lib/CrewConnect/CrewConnect'
import { lastPublishedDay } from '@/helpers/planning'
import { DateTime } from 'luxon'
import { useCapacitorStorage } from '@/lib/useCapacitorStorage'
import { RegEx } from 'simpl-schema'
import { IonRefresher } from '@ionic/vue'

// TODO: use vue-concurrency to manage tasks

const SERVER_URL_KEY = 'TOSYNC.CONNECT.serverUrl'

export const useConnect = defineStore('connect', () => {
  const serverUrl = useCapacitorStorage(SERVER_URL_KEY, '')
  const crewConnect = new CrewConnect(serverUrl.value)

  watch(
    serverUrl,
    url => crewConnect.serverUrl = url
  )

  const state = reactive({
    userId: null,
    changes: null,
    unsignedActivities: null,
    rosterState: null,
    isLoading: false
  })

  const hasChanges = computed(() => state.changes?.workSpaceRosterChangeDtos.length > 0)
  const hasUnsignedActivities = computed(() => state?.unsignedActivities?.length > 0)

  async function execTask(task) {
    state.isLoading = true
    try {
      const result = await task()
      state.isLoading = false
      return result
    } catch (error) {
      state.isLoading = false
      throw error
    }
  }

  async function signIn(crewCode, { silent = false }) {
    return execTask(async () => {
      const { success, userId } = await crewConnect.signIn(crewCode, { silent })
      if (success) {
        state.userId = userId
        await getRosterChanges()
        state.isLoading = false
        return userId
      }
    })
  }

  async function signOut() {
    return execTask(async () => {
      await crewConnect.signOut()
      state.userId = null
      state.changes = null
      state.unsignedActivities = null
      state.rosterState = null
    })
  }

  async function getRosterChanges() {
    return execTask(async () => {
      state.changes = await crewConnect.getRosterChanges()
      return state.changes
    })
  }

  async function getRosterCalendars({ dateFrom, dateTo }) {
    return execTask(async () => {
      const data = await crewConnect.getRosterCalendars({ dateFrom, dateTo })
      console.log('getRosterCalendars', dateFrom, dateTo, data, data?.rosterState?.activitiesInPState3 > 0)
      state.rosterState = data.rosterState
      if (data?.rosterState?.activitiesInPState3 > 0) {
        state.unsignedActivities = getUnsignedActivities(data)
      } else {
        state.unsignedActivities = null
      }
      return data
    })
  }

  async function getLatestRosterCalendars(lastPlanningSync) {
    let dateFrom
    if (lastPlanningSync) {
      const oneDayBeforeLastSyncDate = DateTime.fromISO(lastPlanningSync).toUTC().startOf('day').minus({ days: 1 }).toISO()
      const minimumSyncDate = DateTime.utc().startOf('month').minus({ months: 3 }).toISO()
      dateFrom = oneDayBeforeLastSyncDate < minimumSyncDate ? minimumSyncDate : oneDayBeforeLastSyncDate
    } else {
      dateFrom = DateTime.local().startOf('month').toUTC().toISO()
    }
    const dateTo = lastPublishedDay().toUTC().toISO()
    return getRosterCalendars({ dateFrom, dateTo })
  }

  async function signRoster() {
    if (!state?.rosterState?.activitiesInPState3) throw new Error('Aucune activité à signer !')
    return execTask(async () => {
      const signed = await crewConnect.signRoster(toRaw(state.rosterState))
      const dateFrom = DateTime.utc().startOf('day').toISO()
      const dateTo = lastPublishedDay().toUTC().toISO()
      await getRosterCalendars({ dateFrom, dateTo })
      return signed
    })
  }

  async function signRosterChanges() {
    if (!state?.changes?.workSpaceRosterChangeDtos?.length) throw new Error('Aucune modification à signer !')
    return execTask(async () => {
      await crewConnect.signRosterChanges(toRaw(state.changes.workSpaceRosterChangeDtos))
      state.changes = await crewConnect.getRosterChanges()
    })
  }
  
  return {
    ...toRefs(state),
    serverUrl,
    hasChanges,
    hasUnsignedActivities,
    isConnected: computed(() => state.userId !== null),
    signIn,
    getRosterChanges,
    getRosterCalendars,
    getLatestRosterCalendars,
    signRoster,
    signRosterChanges,
    getCrewsIndex: () => execTask(() => crewConnect.getCrewsIndex()),
    getCrewPhoto: (path, options) => execTask(() => crewConnect.getCrewPhoto(path, options)),
    signOut: () => execTask(() => crewConnect.signOut()),
    cancel: () => crewConnect.cancel()
  }
})

function getUnsignedActivities({ localCalendar, crewCode, rosterState }) {
  const unsignedActivities = new Map()
  localCalendar.forEach(({ crewActivities, afterPublishedDate }) => {
    // if (!afterPublishedDate) {
      crewActivities.forEach((activity) => {
        if (!activity.signed) {
          unsignedActivities.set(activity.opsLegCrewId, activity)
        }
      })
    // }
  })
  return [...unsignedActivities.values()]
}

function getCrewProfile({ crewCode, localCalendar }) {
  const day = localCalendar.find(({ crewActivities }) => crewActivities.some(({ crews }) => crews.some(({ crewCode: _crewCode }) => crewCode === _crewCode)))
  console.log(day)
  return day?.crewActivities.find(({ crews }) => crews.some(({ crewCode: _crewCode }) => crewCode === _crewCode))
}