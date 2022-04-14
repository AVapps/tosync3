<template>
  <div class="crew-connect-widget">
    <loading-button
      v-if="!connect.isConnected"
      @click="signIn()"
      :loading="state.status === 'connecting' || state.isLoading"
      class="full-width"
      shape="round"
    >
      Connexion
    </loading-button>
    <p v-if="connect.user">
      Connecté en tant que {{ connect.user?.userId }}
    </p>
    <loading-button
      v-if="connect.isConnected"
      @click="fetchEvents()"
      :loading="state.status === 'connecting' || state.isLoading"
      class="full-width"
      shape="round"
    >
      Fetch Events
    </loading-button>
    <loading-button
      @click="testImport()"
      :loading="state.status === 'connecting' || state.isLoading"
      class="full-width"
      shape="round"
    >
      Test Importation
    </loading-button>

    <loading-button
      v-if="connect.unsignedActivities?.length"
      @click="signRoster()"
      :loading="state.isLoading"
      class="full-width"
      shape="round"
    >
      Signer Planning
      &nbsp;
      <ion-badge color="secondary">{{ connect.unsignedActivities.length }}</ion-badge>
    </loading-button>
  </div>
</template>

<script setup>
import { IonBadge } from '@ionic/vue'
import { ref, reactive } from 'vue'
import { useUser, useConnect } from '@/store'
import LoadingButton from './LoadingButton.vue'

import { importCrewConnectPlanning } from '@/lib/CrewConnect/importPlanning.js'

import RosterData202106 from '@/data/2021-06-roster-calendars.json'
import RosterData202107 from '@/data/2021-07-roster-calendars.json'
import RosterData202108 from '@/data/2021-08-roster-calendars.json'
import RosterData202109 from '@/data/2021-09-roster-calendars.json'
import RosterData202110 from '@/data/2021-10-roster-calendars.json'
import RosterData202111 from '@/data/2021-11-roster-calendars.json'
import RosterData202112 from '@/data/2021-12-roster-calendars.json'
import RosterData202201 from '@/data/2022-01-roster-calendars.json'
import RosterData202202 from '@/data/2022-02-roster-calendars.json'
import RosterData202203 from '@/data/2022-03-roster-calendars.json'
import RosterData202204 from '@/data/2022-04-roster-calendars.json'

const user = useUser()
const loading = ref(false)
const state = reactive({
  isLoading: false,
  isLoggedIn: false,
  status: 'disconnected',
  user: null
})

const connect = useConnect()

const signIn = async () => {
  try {
    state.isLoading = true
    const resp = await connect.signIn('IEN')
    console.log(resp)
    console.log(connect.user)
    state.isLoggedIn = true
    // await connect.getRosterChanges()
    // await connect.getCrewsIndex()
    const data = await connect.getRosterCalendars({
      dateFrom: '2022-03-01T00:00:00Z',
      dateTo: '2022-03-30T23:59:59Z'
    })
    console.log(data)
  } catch (e) {
    console.log(e, e.errorCode)
    state.isLoggedIn = false
  } finally {
    state.isLoading = false
  }
}

const signRoster = async () => {
  try {
    state.isLoading = true
    const resp = await connect.signRoster()
    console.log('signRoster', resp)
  } catch (e) {
    console.log(e, e.errorCode)
  } finally {
    state.isLoading = false
  }
}

const fetchEvents = async () => {
  try {
    state.isLoading = true
    const data = await connect.getRosterCalendars({
      dateFrom: '2022-04-01T00:00:00Z',
      dateTo: '2022-05-09T23:59:59Z'
    })
    console.log(data)
  } catch (e) {
    console.log(e, e.errorCode)
    state.isLoggedIn = false
  } finally {
    state.isLoading = false
  }
  console.log(connect.unsignedActivities)  
}

const testImport = async () => {
  state.isLoading = true
  for (const data of [RosterData202106, RosterData202107, RosterData202108, RosterData202109, RosterData202110, RosterData202111, RosterData202112, RosterData202201, RosterData202202, RosterData202203, RosterData202204]) {
    try {
      const result = await importCrewConnectPlanning(data)
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  }
  state.isLoading = false
}

</script>

<style lang="scss">
</style>
