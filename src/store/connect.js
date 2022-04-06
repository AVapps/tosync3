import { defineStore } from 'pinia'
import { reactive, computed, toRaw } from 'vue'
import { CrewConnect } from '@/lib/CrewConnect/CrewConnect'

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
    const data = crewConnect.getRosterCalendars({ dateFrom, dateTo })
    state.rosterState = data.rosterState
    if (data?.rosterState?.activitiesInPState3 > 0) {
      state.unsignedActivities = getUnsignedActivities(data)
    }
    return data
  }

  async function signRoster() {
    if (!state?.rosterState?.activitiesInPState3) throw new Error('No unsigned activities')
    const signed = await crewConnect.signRoster(toRaw(state.rosterState))
    // await getRosterCalendars()
    return signed
  }

  async function signRosterChanges() {
    if (!state?.changes?.workSpaceRosterChangeDtos?.length) throw new Error('No changes to sign')
    await crewConnect.signRosterChanges(toRaw(state.changes.workSpaceRosterChangeDtos))
  }
  
  return {
    userId: state.userId,
    changes: state.changes,
    unsignedActivities: state.unsignedActivities,
    signIn,
    isConnected: computed(() => state.userId !== null),
    getRosterChanges,
    getRosterCalendars,
    getCrewsIndex: () => crewConnect.getCrewsIndex(),
    signRosterChanges: (changes) => crewConnect.signRosterChanges(changes),
    signRoster: (data) => crewConnect.signRoster(data),
  }
})

function getUnsignedActivities({ localCalendar, crewCode, rosterState }) {
  const unsignedActivities = new Map()
  localCalendar.forEach(({ crewActivities, afterPublishedDate }) => {
    if (!afterPublishedDate) {
      crewActivities.forEach((activity) => {
        if (!activity.signed) {
          unsignedActivities.set(activity.opsLegCrewId, activity)
        }
      })
    }
  })
  return [...unsignedActivities.values()]
}