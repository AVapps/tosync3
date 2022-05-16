import { OktaCapacitor } from 'okta-capacitor'

const CONFIG = {
  redirectUri: 'com.apm.crewconnect:/callback',
  logoutRedirectUri: 'com.apm.crewconnect:/',
  scopes: ['openid', 'profile', 'offline_access']
}

export class Okta {
  constructor () {
    this._user = null
    this._configured = false
    this._accessToken = null
  }

  /**
   * Configures Okta OIDC client
   * @param {object} apiConfig - Api config returned from the server
   * @param {string} apiConfig.discoveryUri - Okta discovery uri
   * @param {string} apiConfig.clientId - Okta client id
   * @returns {Promise<boolean>} - true if the config was created successfully
   */
  async createConfig({ discoveryUri, clientId }) {
    const { success } = await OktaCapacitor.createConfig({
      ...CONFIG,
      discoveryUri,
      clientId
    })
    this._configured = success
    return this._configured
  }

  async signIn({ silent = false }) {
    if (!this._configured) {
      await this.createConfig()
    }

    console.log('[Okta] signIn initiated', silent)

    const authenticated = await this.isAuthenticated()
    console.log('[Okta] isAuthenticated', authenticated)

    if (authenticated) {
      console.log('[Okta] User is already authenticated.')
      await this.autoRenewTokens()
      const { active } = await this.introspectAccessToken()
      if (active) {
        console.log('[Okta] User has an active access token.')
        this._accessToken = await this.getAccessToken()
        this._user = await this.getUser()
        return this._user
      }
    }

    if (silent) {
      return
    }

    console.log('[Okta] User has no session : starting sign in...')
    const { access_token } = await OktaCapacitor.signIn()
    this._accessToken = access_token
    this._user = await this.getUser()
    return this._user
  }

  async signOut() {
    if (!this._user) return
    await OktaCapacitor.revokeAccessToken()
    await OktaCapacitor.revokeRefreshToken()
    const result = await OktaCapacitor.signOut()
    await OktaCapacitor.clearTokens()
    this._user = null
    return result
  }

  async isAuthenticated() {
    if (!this._configured) {
      await this.createConfig()
    }

    const { authenticated } = await OktaCapacitor.isAuthenticated()
    return authenticated
  }

  async introspectAccessToken() {
    if (!this._configured) {
      await this.createConfig()
    }
    const result = await OktaCapacitor.introspectAccessToken()
    console.log('introspectAccessToken', result)
    return result
  }

  async introspectRefreshToken() {
    if (!this._configured) {
      await this.createConfig()
    }
    const result = await OktaCapacitor.introspectRefreshToken()
    console.log('introspectRefreshToken', result)
    return result
  }

  async refreshTokens() {
    if (!this._configured) {
      await this.createConfig()
    }
    const result = await OktaCapacitor.refreshTokens()
    console.log('refreshTokens', result)
    return result
  }

  async autoRenewTokens() {
    const { exp } = await this.introspectRefreshToken()
    if ((exp * 1000) - Date.now() < 7 * 24 * 60 * 60 * 1000) { // Expires in less than 7 days
      console.log('[Okta] Refreshing tokens...')
      await this.refreshTokens()
    }
  }

  async getUser() {
    return OktaCapacitor.getUser()
  }

  async getAccessToken() {
    const { access_token } = await OktaCapacitor.getAccessToken()
    return access_token
  }

  get configured() {
    return this._configured
  }

  get user() {
    return this._user
  }

  get accessToken() {
    return this._accessToken
  }
}