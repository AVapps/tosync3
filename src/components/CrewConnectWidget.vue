<template>
  <div class="crew-connect-widget">
    <loading-button
      v-if="!state.isLoggedIn"
      @click="signIn()"
      :loading="state.status === 'connecting' || state.isLoading"
      class="full-width"
      shape="round"
    >
      Connexion
    </loading-button>
    <div id="osw-container"></div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useMainStore } from '@/store'
import LoadingButton from './LoadingButton.vue'
import { OktaCapacitor } from 'okta-capacitor' 

console.log(OktaCapacitor)
window.OktaCapacitor = OktaCapacitor

const store = useMainStore()
const loading = ref(false)
const state = reactive({
  isLoading: false,
  isLoggedIn: false,
  status: 'disconnected'
})

const config = {
  discoveryUri: 'https://transaviafr.okta-emea.com',
  clientId: '0oa3r2zbnhZlT9SUy0i7',
  redirectUri: 'com.apm.crewconnect:/callback',
  logoutRedirectUri: 'com.apm.crewconnect:/',
  scopes: ['openid', 'profile', 'offline_access']
}

const signIn = async () => {
  try {
    state.isLoading = true
    const success = await OktaCapacitor.createConfig(config)
    console.log(success)
    const result = await OktaCapacitor.signIn()
    console.log(result)
    state.isLoggedIn = true
  } catch (e) {
    console.log(e, e.errorCode, e.errorSummary, e.errorCauses, e.errorLink)
    state.isLoggedIn = false
  } finally {
    state.isLoading = false
  }
}
</script>

<style lang="scss">
</style>
