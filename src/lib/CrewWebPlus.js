import { InAppBrowser } from '@ionic-native/in-app-browser'
import EventEmitter from 'eventemitter3'

// const ROOT_URL = 'https://planning.to.aero/'
const SIGN_ON_URL = 'https://planning.to.aero/SAML/SingleSignOn'
const OKTA_LOGIN_URL = 'https://transaviafr.okta-emea.com/login/login.htm'
const HOME_URL = 'https://planning.to.aero/Home'
const LOGOUT_URL = 'https://planning.to.aero/Login/Logout'
const PLANNING_URL = '/FlightProgram'
const PDF_URL = '/FlightProgram/GetPdf'
const SIGN_ROSTER_URL = '/FlightProgram/SignRoster'

export class CrewWebPlus extends EventEmitter {
  constructor() {
    super()
    this.browser = null
    this.credentials = null
    this.isLoggedIn = false
    this.hasPendingChanges = false
    this.needsRosterValidation = false
    this._signPending = false

    if (!("TextEncoder" in window)) {
      this.encoder = null
      throw new Error(`Votre navigateur n'est pas compatible avec l'API TextEncoder !`)
    } else {
      this.encoder = new TextEncoder()
    }
  }

  open() {
    if (this.browser) {
      this.browser.show()
    } else {
      this.createBrowserWindow()
    }
  }

  createBrowserWindow() {
    this.browser = InAppBrowser.create(SIGN_ON_URL, '_blank', 'location=no,toolbar=no')

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
          this.emit('signRoster.error')
        }
      })

    this.loadstopSub = this.browser
      .on('loadstop')
      .subscribe((evt) => {
        console.log('[inappbrowser]', evt.type, evt.url, evt)
        this.addCustomToolbar()

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
          console.log('INJECTING saveCredentialsScript')
          this.injectSaveCredentialsScript()
        }
      })

    this.messageSub = this.browser
      .on('message')
      .subscribe((evt) => {
        console.log('[inappbrowser]', evt.type, evt.data?.method, evt.data?.result)
        if (evt.data && evt.data.method) {
          if (evt.data.method === 'tosync.saveCredentials') {
            console.log('storing credentials for later use', evt.data.result)
            this.credentials = evt.data.result
          }

          if (evt.data.method === 'tosync.hideCrewWeb') {
            this.hide()
          }

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
      this.browser.executeScript({ code }, ([ result ]) => {
        resolve(result)
      })
    })
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
      font.style.display = 'inline-block'
      font.style.width = '100%'
    }`
    return this.executeScript({ code })
  }

  async waitFor(eventName) {
    return new Promise((resolve, reject) => {
      this.once(eventName, (...args) => {
        resolve(...args)
      })
      this.once([eventName, 'error'].join('.'), (...args) => {
        reject(...args)
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

  async navigate(url) {
    const navigationProm = new Promise((resolve) => {
      const sub = this.browser.on('loadstart').subscribe((evt) => {
        if (evt.url.indexOf(url) !== -1) {
          sub.unsubscribe()
          resolve()
        }
      })
    })
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