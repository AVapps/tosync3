import { InAppBrowser } from '@ionic-native/in-app-browser'
import EventEmitter from 'eventemitter3'
import { Keychain as CapKeychain } from '@ionic-native/keychain'

import { reactive, toRaw } from 'vue'
import { has } from 'lodash'
import { wait } from './Utils'

// const ROOT_URL = 'https://planning.to.aero/'
const SIGN_ON_URL = 'https://planning.to.aero/SAML/SingleSignOn'
const OKTA_LOGIN_URL = 'https://transaviafr.okta-emea.com/login/login.htm'
const HOME_URL = 'https://planning.to.aero/Home'
const LOGOUT_URL = 'https://planning.to.aero/Login/Logout'
const PLANNING_URL = '/FlightProgram'
const PDF_URL = '/FlightProgram/GetPdf'
const PAST_PDF_URL = '/FlightProgram/GetPastPdf?month='
const PAST_ROSTERS_URL = '/FlightProgram/IndexPastRoster'
const SIGN_ROSTER_URL = '/FlightProgram/SignRoster'
const CHANGES_URL = '/Changes'

const CREDENTIALS_KEY = 'tosync.cw.credentials'

export class CrewWebPlus extends EventEmitter {
  constructor() {
    super()
    this.browser = null
    this.credentials = null
    this._savedCredentials = null
    this._storeCredentials = false
    this._currentUrl = null

    this._state = reactive({
      status: 'closed',
      isLoggedIn: false,
      hasPendingChanges: undefined,
      needsRosterValidation: undefined,
      name: null,
      userId: null
    })

    if (!('TextEncoder' in window)) {
      this.encoder = null
      throw new Error('Votre navigateur n\'est pas compatible avec l\'API TextEncoder !')
    } else {
      this.encoder = new TextEncoder()
    }

    this.on('tosync.saveCredentials', credentials => {
      console.log('storing credentials for later use', credentials)
      this.setCredentials(credentials)
      if (this._storeCredentials) {
        this.saveCredentials().catch(err => console.error(err))
      }
    })

    this.on('tosync.signChanges', () => {
      this.updateState().catch(err => console.error(err))
    })

    this.on('signRoster', () => {
      this.updateState().catch(err => console.error(err))
    })

    this.on('tosync.oktaAuthResponse', ({ ok, status, statusText }) => {
      if (!ok && this.credentials) {
        this.credentials = null
        this.removeCredentials().catch(err => console.error(err))
      }
    })

    this.on('tosync.hideCrewWeb', credentials => {
      this.hide()
    })

    this.on('tosync.log', data => {
      console.log(data)
    })
  }

  get state() {
    return this._state
  }

  set state(state) {
    if (has(state, 'status')) {
      this._state.status = state.status
    }
    if (has(state, 'isLoggedIn')) {
      this._state.isLoggedIn = state.isLoggedIn
    }
    if (has(state, 'hasPendingChanges')) {
      this._state.hasPendingChanges = state.hasPendingChanges
    }
    if (has(state, 'needsRosterValidation')) {
      this._state.needsRosterValidation = state.needsRosterValidation
    }
  }

  async open() {
    if (!this.browser) {
      this.createBrowserWindow()
    } else {
      await this.navigate(SIGN_ON_URL)
    }
    if (!this.credentials) {
      this.browser.show()
    }
  }

  createBrowserWindow() {
    this.browser = InAppBrowser.create(SIGN_ON_URL, '_blank', 'location=no,toolbar=no,hidden=yes')

    this.loadstartSub = this.browser
      .on('loadstart')
      .subscribe((evt) => {
        console.log('[inappbrowser]', evt.type, evt.url)
      })

    this.loaderrorSub = this.browser
      .on('loaderror')
      .subscribe((evt) => {
        console.log('[inappbrowser]', evt.type, evt.url, evt.code, evt.message)
        if (evt.url.indexOf(SIGN_ROSTER_URL) !== -1) {
          this.emit('signRoster.error', evt)
        }
      })

    this.loadstopSub = this.browser
      .on('loadstop')
      .subscribe(async (evt) => {
        console.log('[inappbrowser]', evt.type, evt.url, evt)
        this.addCustomToolbar().catch(err => console.error(err))
        this._currentUrl = evt.url

        if (evt.url.indexOf(HOME_URL) !== -1) {
          if (!this.state.isLoggedIn) {
            this._state.isLoggedIn = true
            this._state.status = 'logged-in'
            this.updateState().then(() => {
              this.emit('login', toRaw(this.state))
            }, err => console.error(err))
          } else {
            this.updateState().catch(err => console.error(err))
          }
        }

        if (evt.url.indexOf(SIGN_ROSTER_URL) !== -1) {
          this.emit('signRoster')
        }

        if (evt.url.indexOf(CHANGES_URL) !== -1) {
          console.log('INJECTING changes validation watcher...')
          this.injectChangesValidationWatcher().catch(err => console.error(err))
        }

        if (evt.url.indexOf(LOGOUT_URL) !== -1) {
          this._state.isLoggedIn = false
          this._state.status = 'logged-out'
          this.emit('logout', toRaw(this.state))
        }

        if (evt.url.indexOf(OKTA_LOGIN_URL) !== -1) {
          if (this.state.isLoggedIn) {
            this._state.isLoggedIn = false
            this._state.status = 'logged-out'
            this.emit('logout', toRaw(this.state))
          }
          console.log('INJECTING okta login watcher...')
          await this.injectOktaLoginWatcher()
          if (this.credentials) {
            console.log('Trying auto-login...')
            await wait(300)
            this.tryLogin().catch(err => console.error(err))
          } else {
            this.show()
          }
        }
      })

    this.messageSub = this.browser
      .on('message')
      .subscribe((evt) => {
        console.log('[inappbrowser]', evt.type, evt.data?.method, evt.data?.result)
        if (evt.data && evt.data.method) {
          this.emit(evt.data.method, evt.data.result)
        }
      })

    this.exitSub = this.browser
      .on('exit')
      .subscribe(() => {
        console.log('[inappbrowser]', 'EXITED')
        this.tearDownBrowser()
      })
  }

  show() {
    if (this.browser) this.browser.show()
  }

  hide() {
    if (this.browser) this.browser.hide()
  }

  setCredentials({ login, password }) {
    if (login && password) {
      this.credentials = { login, password }
    }
  }

  async saveCredentials() {
    if (this.credentials) {
      if (this._savedCredentials && this.credentials.login === this._savedCredentials.login && this.credentials.password === this._savedCredentials.password) {
        // Déjà enregistré
        return
      }
      await CapKeychain.setJson(CREDENTIALS_KEY, this.credentials, true)
      this._savedCredentials = this.credentials
    }
  }

  async loadCredentials() {
    const credentials = await CapKeychain.getJson(CREDENTIALS_KEY, 'Identification requise pour utiliser vos identifiants CrewWebPlus.')
    if (credentials?.login && credentials?.password) {
      this.setCredentials(credentials)
      this._savedCredentials = credentials
      return true
    } else {
      return false
    }
  }

  async removeCredentials() {
    this.credentials = null
    this._savedCredentials = null
    return CapKeychain.remove(CREDENTIALS_KEY)
  }

  storeCredentials(useKeychainStore = true) {
    this._storeCredentials = useKeychainStore
  }

  // Called when reaching Okta login page and credentials are available
  async tryLogin() {
    this._state.status = 'connecting'
    const code = `
    (() => {
      console.log('trying to login...', document.readyState);
      function loginOkta() {
        console.log('loginOkta started...');
        const $username = document.getElementById('okta-signin-username')
        const $password = document.getElementById('okta-signin-password')
        $username.value = '${this.credentials.login}'
        $username.dispatchEvent(new Event('change', { bubbles: true }))
        $password.value = '${this.credentials.password}'
        $password.dispatchEvent(new Event('change', { bubbles: true }))
        document.getElementById('okta-signin-submit').click()
        window.TOSYNC = { loginOkta : true };
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loginOkta);
      } else {
        loginOkta();
      }
    })()`

    const promise = new Promise((resolve, reject) => {
      this.once('tosync.oktaAuthResponse', ({ ok, status, statusText }) => {
        if (ok) {
          resolve()
        } else {
          this.show()
          reject(statusText)
        }
      })
    })

    await this.executeScript({ code })
    return promise
  }

  tearDownBrowser() {
    [this.loadstartSub, this.loaderrorSub, this.loadstopSub, this.messageSub, this.exitSub].forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe()
      }
    })
    this.browser = null
  }

  async signRoster() {
    if (!this.state.isLoggedIn) throw new Error('You must be logged in to download your flight program file.')
    this.show()
    await this.navigate(PLANNING_URL)
    await this.waitFor('signRoster')
    this.hide()
  }

  async signChanges() {
    if (!this.state.isLoggedIn) throw new Error('You must be logged in to download your flight program file.')
    this.show()
    await this.navigate(CHANGES_URL)
    await this.waitFor('tosync.signChanges')
    this.hide()
  }

  async getPDFFile(isomonth) {
    if (!this.state.isLoggedIn) throw new Error('You must be logged in to download your flight program file.')
    const result = await this._fetchPDF(isomonth)
    return this.encoder.encode(result)
  }

  async _fetchPDF(isomonth) {
    let url
    if (isomonth) {
      url = PAST_PDF_URL + isomonth
    } else {
      url = PDF_URL
      if (this._currentUrl.indexOf(PAST_ROSTERS_URL) === -1) {
        await this.navigate(PAST_ROSTERS_URL)
      }
    }
    const code = `
    fetch('${url}')
      .then(function(response) {
        return response.arrayBuffer();
      })
      .then(function(ab) {
        webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
          method: 'tosync.fetchPDF',
          result: (new TextDecoder('utf-8')).decode(ab)
        }));
      });`

    const resultP = new Promise((resolve) => {
      this.once('tosync.fetchPDF', (result) => resolve(result))
    })
    this.executeScript({ code })
    return resultP
  }

  async updateState() {
    if (!this.state.isLoggedIn) return

    if (this._currentUrl.indexOf(HOME_URL) === -1) {
      return this.navigate(HOME_URL)
    }

    const homeinfo = await this._getHomeInfo()

    if (homeinfo.rosterchanges) {
      this._state.hasPendingChanges = !!homeinfo.rosterchanges?.content
    }

    if (homeinfo.rostervalidation) {
      this._state.needsRosterValidation = homeinfo.rostervalidation?.content?.indexOf('Please validate your planning') !== -1
    }

    if (homeinfo.name) {
      this._state.name = homeinfo.name
      this._state.userId = homeinfo.userId
    }
  }

  async _getHomeInfo() {
    if (!this.state.isLoggedIn) throw new Error('You must be logged in to get dashboard info.')
    const code = `
    (() => {
      const state = {};
      document.querySelectorAll('.HomeInfo').forEach(el => {
        const key = el.querySelector('.HomeText')?.innerText?.trim().toLowerCase().replace(/\\s/g,'');
        if (key) {
          state[key] = {
            link: el.querySelector('.HomeLink > a')?.getAttribute('href'),
            content: el.querySelector('.HomeLink > a')?.innerText?.trim()
          }
        }
      });
      const userString = document.getElementById('rpPageHeader')?.textContent?.trim()
      if (userString) {
        const match = userString.match(/^(.+)\\s\\(([A-Z]{3})\\)$/)
        if (match.length === 3) {
          state.name = match[1]
          state.userId = match[2]
        }
      }
      return state;
    })()`

    return new Promise(resolve => {
      this.browser.executeScript({ code }, ([result]) => {
        resolve(result)
      })
    })
  }

  async injectOktaLoginWatcher() {
    const code = `
      (function(ns, fetch){
        if (typeof fetch !== 'function') return;
        ns.fetch = function() {
          const login = document.getElementById('okta-signin-username').value;
          const password = document.getElementById('okta-signin-password').value;
          const out = fetch.apply(this, arguments);
          out.then((resp) => {
            if (resp.url === 'https://transaviafr.okta-emea.com/api/v1/authn') {
              webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
                method: 'tosync.oktaAuthResponse',
                result: { ok: resp.ok, status: resp.status, statusText: resp.statusText, url: resp.url }
              }));
              if (resp.ok) {
                webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
                  method: 'tosync.saveCredentials',
                  result: { login, password }
                }));
              }
            }
          })
          return out;
        }
      }(window, window.fetch))`
    return this.executeScript({ code })
  }

  async injectChangesValidationWatcher() {
    const code = `
    $(function () {
      $(document).ajaxComplete(function(event, xhr, settings) {
        if (settings.url === '/Changes/CallbackPartial' && settings.data?.indexOf('SignDay=') !== -1) {
          const success = xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200
          webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
            method: success ? 'tosync.signChanges' : 'tosync.signChanges.error',
            result: {
              method: settings.type,
              url: settings.url,
              status: xhr.status,
              statusText: xhr.statusText,
              data: settings.data
            }
          }))
        }
      })
    })`
    return this.executeScript({ code })
  }

  async addCustomToolbar() {
    const code = `
    (() => {
      const div = document.createElement('div')
      const button = document.createElement('a')
      const text = document.createTextNode('Fermer')
      div.appendChild(button)
      button.appendChild(text)
      div.style.position = 'fixed'
      div.style.bottom = 0
      div.style.left = 0
      div.style.color = "#00D66D"
      div.style.backgroundColor = "#000000"
      div.style.width = "100vw"
      div.style.fontFamily = '-apple-system, sans-serif'
      div.style.fontSize = '1.1rem'
      button.style.display = 'inline-block'
      button.style.padding = '1rem'
      button.addEventListener('click', () => webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
        method: 'tosync.hideCrewWeb',
        result: {}
      })))
      document.body.appendChild(div)
      document.body.style.paddingBottom = '3rem'
      const fontEl = document.body.querySelector('font')
      if (fontEl) {
        fontEl.style.display = 'inline-block'
        fontEl.style.width = '100%'
      }
    })()`
    return this.executeScript({ code })
  }

  async waitFor(eventName) {
    return new Promise((resolve, reject) => {
      this.once(eventName, (...args) => {
        resolve(...args)
      })
      this.once([eventName, 'error'].join('.'), ({ message }) => {
        reject(new Error(message))
      })
    })
  }

  async waitForLogin() {
    if (this.state.isLoggedIn) {
      return Promise.resolve()
    } else {
      return this.waitFor('login')
    }
  }

  async waitForURL(url) {
    const navigationProm = new Promise((resolve, reject) => {
      const loadSub = this.browser.on('loadstop').subscribe((evt) => {
        if (evt.url.indexOf(url) !== -1) {
          loadSub.unsubscribe()
          resolve()
        }
      })
      const errorSub = this.browser.on('loaderror').subscribe((evt) => {
        if (evt.url.indexOf(url) !== -1) {
          errorSub.unsubscribe()
          reject(evt.message)
        }
      })
    })
    return navigationProm
  }

  async navigate(url) {
    const navigationProm = this.waitForURL(url)
    this.executeScript({
      code: `window.location.assign('${url}');`
    })
    return navigationProm
  }

  async executeScript(payload) {
    return new Promise((resolve) => {
      this.browser.executeScript(payload, (...args) => {
        resolve(...args)
      })
    })
  }
}
