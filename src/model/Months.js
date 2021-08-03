import { PouchDBCollection } from './PouchDBCollection.js'
import { monthSchema } from './month/index.js'

import { isUndefined, keys } from 'lodash'

export class MonthsCollection extends PouchDBCollection {
  constructor() {
    super('months', {
      idFunction: ['userId', 'month']
    })
  }

  async insert(doc) {
    monthSchema.validate(doc)
    return super.insert(doc)
  }

  async upsert(doc) {
    monthSchema.validate(doc)
    return super.upsert(doc)
  }

  async update(key, changes) {
    if (isUndefined(changes)) {
      monthSchema.validate(key, { keys: keys(key) })
    } else {
      monthSchema.validate(changes, { keys: keys(changes) })
    }
    return super.update(key, changes)
  }
}
