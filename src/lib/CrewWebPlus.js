import { InAppBrowser } from '@ionic-native/in-app-browser'
import EventEmitter from 'eventemitter3'
import { Keychain as CapKeychain } from '@ionic-native/keychain'

// const ROOT_URL = 'https://planning.to.aero/'
const SIGN_ON_URL = 'https://planning.to.aero/SAML/SingleSignOn'
const OKTA_LOGIN_URL = 'https://transaviafr.okta-emea.com/login/login.htm'
const HOME_URL = 'https://planning.to.aero/Home'
const LOGOUT_URL = 'https://planning.to.aero/Login/Logout'
const PLANNING_URL = '/FlightProgram'
const PDF_URL = '/FlightProgram/GetPdf'
const SIGN_ROSTER_URL = '/FlightProgram/SignRoster'
const CHANGES_URL = '/Changes'

const CREDENTIALS_KEY = 'tosync.cw.credentials'

export class CrewWebPlus extends EventEmitter {
  constructor() {
    super()
    this.browser = null
    this.credentials = null
    this.isLoggedIn = false
    this.hasPendingChanges = false
    this.needsRosterValidation = false
    this._signPending = false

    if (!('TextEncoder' in window)) {
      this.encoder = null
      throw new Error('Votre navigateur n\'est pas compatible avec l\'API TextEncoder !')
    } else {
      this.encoder = new TextEncoder()
    }

    this.on('tosync.saveCredentials', credentials => {
      console.log('storing credentials for later use', credentials)
      this.setCredentials(credentials)
    })

    this.on('tosync.oktaAuthResponse', ({ ok, status, statusText }) => {
      if (!ok && this.credentials) {
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

  async open() {
    if (!this.browser) {
      this.createBrowserWindow()
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

        if (evt.url.indexOf(HOME_URL) !== -1) {
          this.isLoggedIn = true
          this.emit('login')
        }

        if (evt.url.indexOf(SIGN_ROSTER_URL) !== -1) {
          this.emit('signRoster')
        }

        if (evt.url.indexOf(LOGOUT_URL) !== -1) {
          this.isLoggedIn = false
          this.emit('logout')
        }

        if (evt.url.indexOf(OKTA_LOGIN_URL) !== -1) {
          this.isLoggedIn = false
          console.log('INJECTING okta login watcher...')
          await this.injectOktaLoginWatcher()
          if (this.credentials) {
            console.log('Trying auto-login...')
            this.tryLogin().catch(err => console.error(err))
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
    if (!this.isLoggedIn) throw new Error('You must be logged in to access this function.')
    if (this.credentials) {
      return CapKeychain.setJson(CREDENTIALS_KEY, this.credentials, true)
    }
  }

  async loadCredentials() {
    const credentials = await CapKeychain.getJson(CREDENTIALS_KEY, 'Identification requise pour utiliser vos identifiants CrewWebPlus.')
    if (credentials?.login && credentials?.password) {
      this.credentials = credentials
      return true
    } else {
      return false
    }
  }

  async removeCredentials() {
    this.credentials = null
    return CapKeychain.remove(CREDENTIALS_KEY)
  }

  // Called when reaching Okta login page and credentials are available
  async tryLogin() {
    const code = `
    console.log('trying to login...', document.readyState);
    function loginOkta() {
      console.log('loginOkta started...');
      document.getElementById('okta-signin-username').value = '${this.credentials.login}';
      document.getElementById('okta-signin-password').value = '${this.credentials.password}';
      document.getElementById('okta-signin-submit').click();
      window.TOSYNC = { loginOkta : true };
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loginOkta);
    } else {
      loginOkta();
    }`

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
    if (!this.isLoggedIn) throw new Error('You must be logged in to download your flight program file.')
    this.show()
    await this.navigate(PLANNING_URL)
    await this.waitFor('signRoster')
    this.hide()
    return this.getUserState()
  }

  async signChanges() {
    if (!this.isLoggedIn) throw new Error('You must be logged in to download your flight program file.')
    this.show()
    await this.navigate(CHANGES_URL)
    await this.waitFor('signChanges')
    this.hide()
    return this.getUserState()
  }

  async getPDFFile() {
    if (!this.isLoggedIn) throw new Error('You must be logged in to download your flight program file.')
    const result = await this._fetchPDF()
    return this.encoder.encode(result)
  }

  async _fetchPDF() {
    const code = `fetch('${PDF_URL}')
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

  async getUserState() {
    if (!this.isLoggedIn) throw new Error('You must be logged in to user status.')
    await this.navigate(HOME_URL)
    const homeinfo = await this._getHomeInfo()
    console.log(homeinfo)

    if (homeinfo.rosterchanges) {
      this.hasPendingChanges = !!homeinfo.rosterchanges?.content
    }

    if (homeinfo.rostervalidation) {
      this.needsRosterValidation = homeinfo.rostervalidation?.content?.indexOf('Please validate your planning') !== -1
    }
    return {
      connected: this.isLoggedIn,
      hasPendingChanges: this.hasPendingChanges,
      needsRosterValidation: this.needsRosterValidation
    }
  }

  async _getHomeInfo() {
    if (!this.isLoggedIn) throw new Error('You must be logged in to get dashboard info.')
    const code = `
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
    state;`

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

  async injectSaveCredentialsScript() {
    const code = `
    console.log('trying to listenForSubmit...', document.readyState);
    function listenForSubmit() {
      console.log('listenForSubmit started...')
      document.querySelector('form.primary-auth-form').addEventListener('submit', () => {
        console.log('ON SUBMIT EVENT');
        const login = document.getElementById('okta-signin-username').value;
        const password = document.getElementById('okta-signin-password').value;
        webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
          method: 'tosync.saveCredentials',
          result: { login, password }
        }));
      });
      window.TOSYNC = true;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', listenForSubmit);
    } else {
      listenForSubmit();
    }`
    return this.executeScript({ code })
  }

  async addCustomToolbar() {
    const code = `
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
    }`
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
    if (this.isLoggedIn) {
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
