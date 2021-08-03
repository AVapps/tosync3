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

  find(serie, { route, start, from, to }) {
    if (!route && from && to) {
      route = [from, to].join('-')
    }
    const datetime = DateTime.fromMillis(start)
    const saison = SAISON[datetime.month]
    const isoMonth = datetime.toISODate().substring(0, 7)

    const key = [serie, saison, route, isoMonth].join('.')

    if (this.memo.has(key)) {
      return this.memo.get(key)
    } else {
      const tvref = this._find(serie, saison, route, isoMonth)
      if (tvref) {
        this.memo.set(key, tvref.tr)
      }
      return tvref
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
