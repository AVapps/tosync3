import { defineStore } from 'pinia'
import { reactive, computed, toRaw, toRefs } from 'vue'
import { CrewConnect } from '@/lib/CrewConnect/CrewConnect'
import { lastPublishedDay } from '@/helpers/planning'
import { DateTime } from 'luxon'
import { Storage } from '@capacitor/storage'

export const useConnect = defineStore('connect', () => {
  const crewConnect = new CrewConnect()

  const state = reactive({
    userId: null,
    changes: null,
    unsignedActivities: null,
    rosterState: null
  })

  async function signIn(crewCode) {
    const { userId } = await crewConnect.signIn(crewCode)
    state.userId = userId
    await getRosterChanges()
    return userId
  }

  async function tryAutoRelogin(crewCode) {
    const { userId } = await crewConnect.tryAutoRelogin(crewCode)
    state.userId = userId
    await getRosterChanges()
    return userId
  }

  async function signOut() {
    await crewConnect.signOut()
    state.userId = null
    state.changes = null
    state.unsignedActivities = null
    state.rosterState = null
  }

  async function getRosterChanges() {
    state.changes = await crewConnect.getRosterChanges()
    return state.changes
  }

  async function getRosterCalendars({ dateFrom, dateTo }) {
    const data = await crewConnect.getRosterCalendars({ dateFrom, dateTo })
    console.log('getRosterCalendars', data, data?.rosterState?.activitiesInPState3 > 0)
    state.rosterState = data.rosterState
    if (data?.rosterState?.activitiesInPState3 > 0) {
      state.unsignedActivities = getUnsignedActivities(data)
    }
    return data
  }

  async function getLatestRosterCalendars() {
    const dateFrom = DateTime.local().startOf('month').toUTC().toISO()
    const dateTo = lastPublishedDay().toUTC().toISO()
    return getRosterCalendars({ dateFrom, dateTo })
  }

  async function signRoster() {
    if (!state?.rosterState?.activitiesInPState3) throw new Error('No unsigned activities')
    const signed = await crewConnect.signRoster(toRaw(state.rosterState))
    const dateFrom = DateTime.utc().startOf('day').toISO()
    const dateTo = lastPublishedDay().toUTC().toISO()
    console.log(dateFrom, dateTo)
    await getRosterCalendars({ dateFrom, dateTo })
    return signed
  }

  async function signRosterChanges() {
    if (!state?.changes?.workSpaceRosterChangeDtos?.length) throw new Error('No changes to sign')
    await crewConnect.signRosterChanges(toRaw(state.changes.workSpaceRosterChangeDtos))
  }
  
  return {
    ...toRefs(state),
    isConnected: computed(() => state.userId !== null),
    signIn,
    tryAutoRelogin,
    getRosterChanges,
    getRosterCalendars,
    signRoster,
    signRosterChanges,
    getCrewsIndex: () => crewConnect.getCrewsIndex(),
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