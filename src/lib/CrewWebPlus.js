import { InAppBrowser } from '@ionic-native/in-app-browser'
import EventEmitter from 'eventemitter3'

// const ROOT_URL = 'https://planning.to.aero/'
const SIGN_ON_URL = 'https://planning.to.aero/SAML/SingleSignOn'
const HOME_URL = 'https://planning.to.aero/Home'
// const PLANNING_URL = '/FlightProgram'
const PDF_URL = '/FlightProgram/GetPdf'

export class CrewWebPlus extends EventEmitter {
  constructor() {
    super()
    this.browser = null
    this.isLoggedIn = false
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
    this.browser = InAppBrowser.create(SIGN_ON_URL, '_blank', 'location=no,closebuttoncolor=#00d66c,closebuttoncaption=Fermer,hidenavigationbuttons=yes')

    // this.browser.on('loadstart').subscribe((evt) => {
    //   console.log('[inappbrowser]', evt.type, evt.url)
    // })

    this.loadstopSub = this.browser.on('loadstop').subscribe((evt) => {
      console.log('[inappbrowser]', evt.type, evt.url)
      if (evt.url.indexOf(HOME_URL) !== -1) {
        // this.emit('navigate.home')
        this.isLoggedIn = true
        this.emit('login')
      }

      // if (evt.url.indexOf(PLANNING_URL) !== -1) {
      //   this.emit('navigate.planning')
      // }
    })

    this.messageSub = this.browser.on('message').subscribe((evt) => {
      console.log('[inappbrowser]', evt.type, evt.data.method)
      if (evt.data && evt.data.method) {
        this.emit(evt.data.method, evt.data.result)
      }
    })

    this.exitSub = this.browser.on('exit').subscribe(() => {
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
    [this.loadstopSub, this.messageSub, this.exitSub].forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe()
      }
    })
    this.browser = null
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

  async wait(eventName) {
    return new Promise((resolve) => {
      this.once(eventName, (...args) => {
        resolve(...args)
      })
    })
  }

  async waitForLogin() {
    if (this.isLoggedIn) {
      return Promise.resolve()
    } else {
      return this.wait('login')
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

// function wait(ms) {
//   return new Promise((resolve) => {
//     setTimeout(function () {
//       resolve()
//     }, ms)
//   })
// }