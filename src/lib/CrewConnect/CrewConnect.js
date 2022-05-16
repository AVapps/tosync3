import { Okta } from './Okta.js'
// import { Http } from '@capacitor-community/http'
import { Http } from './CancelableHttp.js'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'
import { DateTime } from 'luxon'
import { blobToBase64 } from '@/helpers/utils.js'

const USER_AGENT = 'APMConnect/1 CFNetwork/1329 Darwin/21.3.0'
const STORE_PREFIX = 'tosync_cctoken'
const READ_TIMEOUT = 15 * 1000
const CONNECT_TIMEOUT = 15 * 1000

const defaultOptions = {
  connectTimeout: CONNECT_TIMEOUT,
  readTimeout: READ_TIMEOUT
}

const headers = {
  'User-Agent': USER_AGENT,
  'Content-Type': 'application/json'
}

export class CrewConnect {
  constructor (serverUrl = '') {
    this._serverUrl = serverUrl
    this._userId = null
    this._token = null
    this.okta = new Okta()
  }

  async configureOkta() {
    const apiConfig = await this.getApiConfig()
    const configured = await this.okta.createConfig(apiConfig)
    return configured
  }

  async signIn(userId, { silent = false }) {
    console.log(silent)
    if (userId) {
      const result = await this.tryTokenLogin(userId)
      if (result?.success) {
        return result
      }
    }

    if (!this.okta.configured) {
      await this.configureOkta()
    }

    const user = await this.okta.signIn({ silent })
    console.log('okta signIn', user)

    if (user) {
      return this.login(user.crewCode, this.okta.accessToken)
    }
    return {
      success: false,
      userId: null
    }
  }

  async login(userId, accessToken) {
    this._checkServerURL()
    if (!userId || !accessToken) throw new Error('Invalid userId or accessToken')

    const { status, data } = await Http.post({
      ...defaultOptions,
      url: this.loginUrl,
      headers,
      data: {
        userId,
        accessToken
      }
    })

    console.log('login', status, data)

    if (status === 200 && data.token && data.userId) {
      this._setUserId(data.userId)
      this._token = data.token
      await this.saveToken()
      return {
        success: true,
        userId: this.userId
      }
    }

    console.log('Token login failed !', status, data)
    throw new Error('Login failed')
  }

  async tryTokenLogin(userId) {
    const token = await this.getTokenForUser(userId)
    if (!token) return
    const valid = await this.checkToken(token)
    if (!valid) return
    this._token = token
    this._setUserId(userId)
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
    this._checkServerURL()
    let { data } = await Http.get({
      ...defaultOptions,
      url: `${this.apiUrl}/token/introspect`,
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
    this._checkServerURL()
    const { data } = await Http.get({
      ...defaultOptions,
      url: this.apiUrl + '/config',
      headers
    })
    console.log('config', data)
    return data
  }

  async getCrewsIndex() {
    this._checkServerURL()
    const { data } = await Http.get({
      ...defaultOptions,
      url: this.crewsUrl,
      params: {
        '_': Date.now().toString()
      },
      headers: this._headersWithToken(),
    })
    console.log('crews', data)
    return data
  }

  async getCrewPhoto(path, { format = 'dataUrl' } = {}) {
    this._checkServerURL()
    const { data } = await Http.get({
      ...defaultOptions,
      url: `${this.serverUrl}/${path}`,
      responseType: 'blob',
      headers: {
        ...this._headersWithToken(),
        'Content-Type': 'image/jpeg'
      }
    })
    console.log('crew photo', data)
    if (format === 'dataUrl') {
      return blobToBase64(data)
    } else {
      return data
    }
  }

  async getRosterChanges() {
    this._checkServerURL()
    if (!this.userId) throw new Error('You must be logged in to access this ressource.')
    const { data } = await Http.get({
      ...defaultOptions,
      url: `${this.crewsUrl}/${this.userId}/roster-changes`,
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
    this._checkServerURL()
    console.log('getRosterCalendars', this.userId)
    if (!this.userId) throw new Error('You must be logged in to access this ressource.')
    const { data } = await Http.get({
      ...defaultOptions,
      url: `${this.crewsUrl}/${this.userId}/roster-calendars`,
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
    this._checkServerURL()
    console.log('signRoster', this.userId, rosterState)
    const { status, data } = await Http.post({
      ...defaultOptions,
      url: `${this.crewsUrl}/${this.userId}/sign-roster`,
      headers: this._headersWithToken(),
      data: rosterState,
      responseType: 'text'
    })
    console.log('sign-roster', status, data)
    return status === 200 && data.includes('Roster signed')
  }

  async signRosterChanges(changes) {
    this._checkServerURL()
    console.log('signRosterChanges', this.userId, changes)
    const { status } = await Http.post({
      ...defaultOptions,
      url: `${this.crewsUrl}/${this.userId}/sign-roster-changes`,
      headers: this._headersWithToken(),
      data: changes,
      responseType: 'text'
    })
    console.log('sign-roster-changes', status)
    return status === 200
  }

  _headersWithToken() {
    if (!this._token) throw new Error('No token defined')
    return {
      ...headers,
      Authorization: `Bearer ${this._token}`
    }
  }

  _checkServerURL() {
    if (!this.serverUrl) throw new Error('No server URL provided')
  }

  get userId() {
    return this._userId
  }

  set userId(userId) {
    throw new Error('You cannot set the userId')
  }

  get serverUrl() {
    return this._serverUrl
  }

  set serverUrl(url) {
    this._serverUrl = url
    this._setUserId(null)
    this._token = null
  }

  _setUserId(userId) {
    this._userId = userId
  }

  get user() {
    return this.okta.user
  }

  get loginUrl() {
    return `${this.serverUrl}/login`
  }

  get apiUrl() {
    return `${this.serverUrl}/api`
  }

  get crewsUrl() {
    return `${this.apiUrl}/crews`
  }
}