import { DateTime, Settings } from 'luxon'
import { findLast, get, has } from 'lodash'
import TvrefData from '@/data/tvref-db-sorted.json'

Settings.defaultLocale = 'fr'
Settings.defaultZoneName = 'Europe/Paris'

const SAISON = {
  1: 'W',
  2: 'W',
  3: 'W',
  4: 'S',
  5: 'S',
  6: 'S',
  7: 'S',
  8: 'S',
  9: 'S',
  10: 'S',
  11: 'W',
  12: 'W'
}

export class TVrefCollection {
  constructor() {
    this.data = TvrefData
    this.memo = new Map()
  }

  /**
   * Finds the TVref for a given serie, date and route
   * @param {String} serie - 'TOA' ou 'TOB'
   * @param {Object} params - Must contain 'route' or ('from' and 'to')
   * @param {String} params.route - IATA codes route (ex: 'LHR-CDG')
   * @param {Number} params.start - Timestamp of the start of the flight
   * @param {Number} [params.from] - IATA code of the departure airport
   * @param {Number} [params.to] - IATA code of the destination airport
   * @returns 
   */
  find(serie, { route, start, from, to }) {
    if (!route && from && to) {
      route = [from, to].join('-')
    }
    const dt = DateTime.fromMillis(start)
    const saison = SAISON[dt.month]
    const isoMonth = dt.toISODate().substring(0, 7)

    const key = [serie, saison, route, isoMonth].join('.')

    if (this.memo.has(key)) {
      console.log('---  TVref trouvé dans le cache ---', key, this.memo.get(key))
      return this.memo.get(key)
    } else {
      const tr = this._find(serie, saison, route, isoMonth)
      console.log('---  TVref trouvé ---', key, tr)
      if (tr) {
        this.memo.set(key, tr)
      }
      return tr
    }
  }

  _find(serie, saison, route, month) {
    const path = [serie, saison, route].join('.')
    if (has(this.data, path)) {
      const collection = get(this.data, path)
      if (collection.length) {
        const tvref = findLast(collection, t => t.mois <= month)
        return (tvref || collection[0]).tr
      }
    }
  }
}

export const TVref = new TVrefCollection()
