import { Okta } from './Okta.js'
import { Http } from '@capacitor-community/http'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'
import { DateTime } from 'luxon'
import EventEmitter from 'eventemitter3'

// SecureStoragePlugin.set({ key, value })
// SecureStoragePlugin.get({ key })

const SERVER_URL = 'https://crewmobile.to.aero'
const LOGIN_URL = `${SERVER_URL}/login`
const API_BASE_URL = `${SERVER_URL}/api`
const CREWS_API_URL = `${API_BASE_URL}/crews`
const TOKEN_INTROSPECT_URL = `${API_BASE_URL}/token/introspect`

const USER_AGENT = 'APMConnect/1 CFNetwork/1329 Darwin/21.3.0'
const STORE_PREFIX = 'tosync_cctoken'

const READ_TIMEOUT = 10000
const CONNECT_TIMEOUT = 10000

const defaultOptions = {
  connectTimeout: CONNECT_TIMEOUT,
  readTimeout: READ_TIMEOUT
}

const headers = {
  'User-Agent': USER_AGENT,
  'Content-Type': 'application/json'
}

export class CrewConnect extends EventEmitter {
  constructor () {
    super()
    this._userId = null
    this._token = null
    this.okta = new Okta()
  }

  get userId() {
    return this._userId
  }

  set userId(userId) {
    throw new Error('You cannot set the userId')
  }

  setUserId(userId) {
    this._userId = userId
    this.emit('login', userId)
  }

  get user() {
    return this.okta.user
  }

  async configureOkta() {
    const apiConfig = await this.getApiConfig()
    const configured = await this.okta.createConfig(apiConfig)
    return configured
  }

  async signIn(userId) {
    if (userId) {
      const result = await this.tryTokenLogin(userId)
      if (result?.success) {
        return result
      }
    }

    if (!this.okta.configured) {
      await this.configureOkta()
    }

    const user = await this.okta.signIn()
    console.log('okta signIn', user)

    return this.login(user.crewCode, this.okta.accessToken)
  }

  async login(userId, accessToken) {
    if (!userId || !accessToken) throw new Error('Invalid userId or accessToken')

    const { status, data } = await Http.post({
      ...defaultOptions,
      url: LOGIN_URL,
      headers,
      data: {
        userId,
        accessToken
      }
    })

    console.log('login', status, data)

    if (status === 200 && data.token && data.userId) {
      this.setUserId(data.userId)
      this._token = data.token
      await this.saveToken()
      return {
        success: true,
        userId: this.userId
      }
    }

    throw new Error('Login failed')
  }

  async tryTokenLogin(userId) {
    const token = await this.getTokenForUser(userId)
    if (!token) return
    const valid = await this.checkToken(token)
    if (!valid) return
    this._token = token
    this.setUserId(userId)
    return {
      success: true,
      userId
    }
  }

  async signOut() {
    await this.okta.signOut()
    const key = `${STORE_PREFIX}_${this.userId}`
    await SecureStoragePlugin.remove({ key })
    this._token = null
    this._userId = null
    this.emit('logout')
  }

  async saveToken() {
    if (!this._token || !this.userId) return
    const key = `${STORE_PREFIX}_${this.userId}`
    return SecureStoragePlugin.set({ key, value: this._token })
  }

  async getTokenForUser(userId) {
    const key = `${STORE_PREFIX}_${userId}`
    try {
      const { value } = await SecureStoragePlugin.get({ key })
      console.log('getTokenForUser', userId, value)
      return value
    } catch (e) {
      return null
    }
  }

  async checkToken(token) {
    let { data } = await Http.get({
      ...defaultOptions,
      url: TOKEN_INTROSPECT_URL,
      headers,
      params: {
        token,
        '_': Date.now().toString()
      }
    })
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
    console.log('checkToken', data)
    // return data.exp * 1000 > (Date.now() + 60 * 1000)
    return data.active
  }

  async getApiConfig() {
    const { data } = await Http.get({
      ...defaultOptions,
      url: API_BASE_URL + '/config',
      headers
    })
    console.log('config', data)
    return data
  }

  async getCrewsIndex() {
    const { data } = await Http.get({
      ...defaultOptions,
      url: CREWS_API_URL,
      params: {
        '_': Date.now().toString()
      },
      headers: this._headersWithToken(),
    })
    console.log('crews', data)
    return data
  }

  async getRosterChanges() {
    if (!this.userId) throw new Error('You must be logged in to access this ressource.')
    const { data } = await Http.get({
      ...defaultOptions,
      url: `${CREWS_API_URL}/${this.userId}/roster-changes`,
      params: {
        '_': Date.now().toString()
      },
      headers: this._headersWithToken(),
    })
    console.log('roster-changes', data)
    return data
  }

  /**
   * Returns calendar events for current crew and passed date range
   * @param {object} range
   * @param {string} range.dateFrom - YYYY-MM-DDTHH:mm:ssZ
   * @param {string} range.dateTo - YYYY-MM-DDT23:59:59Z
   * @returns {Promise<any>}
   */
  async getRosterCalendars({ dateFrom, dateTo }) {
    console.log('getRosterCalendars', this.userId)
    if (!this.userId) throw new Error('You must be logged in to access this ressource.')
    const { data } = await Http.get({
      ...defaultOptions,
      url: `${CREWS_API_URL}/${this.userId}/roster-calendars`,
      params: {
        dateFrom,
        dateTo,
        '_': Date.now().toString()
      },
      headers: this._headersWithToken(),
    })
    console.log('roster-calendars', data)
    return data
  }

  async signRoster(rosterState) {
    console.log('signRoster', this.userId, rosterState)
    const { status, data } = await Http.post({
      ...defaultOptions,
      url: `${CREWS_API_URL}/${this.userId}/sign-roster`,
      headers: this._headersWithToken(),
      data: rosterState
    })
    console.log('sign-roster', status, data)
    return status === 200 && data.includes('Roster signed')
  }

  async signRosterChanges(changes) {
    console.log('signRosterChanges', this.userId, changes)
    const { status, data } = await Http.post({
      ...defaultOptions,
      url: `${CREWS_API_URL}/${this.userId}/sign-roster-changes`,
      headers: this._headersWithToken(),
      data: changes
    })
    console.log('sign-roster-changes', status, data)
    if (status === 200) {
      return data
    }
  }

  _headersWithToken() {
    if (!this._token) throw new Error('No token defined')
    return {
      ...headers,
      Authorization: `Bearer ${this._token}`
    }
  }
}