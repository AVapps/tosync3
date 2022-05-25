import { defineStore } from 'pinia'
import { EventsDatasourceClient } from '@/model/EventsDatasourceClient'
import { useUser } from './user'

export const usePlanning = defineStore('planning', () => {
  const client = new EventsDatasourceClient()
  const user = useUser()

  // Subscibe functions
  async function subscribeMonth(month) {
    return client.subscribeMonth({ userId: user.userId }, month)
  }

  async function unsubscribeMonth(month) {
    return client.unsubscribeMonth(user.userId, month)
  }

  async function subscribeInterval({ start, end }) {
    return client.subscribeInterval({ userId: user.userId }, start, end)
  }

  async function unsubscribe(subKey) {
    return client.unsubscribe(user.userId, subKey)
  }

  // Import functions
  async function importCrewConnectData({ localCalendar, crewCode, rosterState }) {
    return client.importCrewConnectData({ localCalendar, crewCode, rosterState })
  }

  async function bulkUpdate(updateLog) {
    return client.bulkUpdate(updateLog)
  }

  async function clearDb() {
    return client.clearDb()
  }

  // Reactive data functions
  function getDay(date) {
    return client.getDay(user.userId, date)
  }

  function getEvent(id) {
    return client.getEvent(id)
  }

  return {
    importCrewConnectData,
    subscribeMonth,
    unsubscribeMonth,
    subscribeInterval,
    unsubscribe,
    bulkUpdate,
    clearDb,
    getDay,
    getEvent
  }
})
