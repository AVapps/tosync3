import { db } from './db.js'
import { nanoid } from 'nanoid'
import { has } from 'lodash'

export class DexieCollection {
  constructor(tableName, options = {}) {
    this.db = db
    this.collection = db.table(tableName)
    const { generateIds = true, idKey = '_id' } = options
    this.options = { generateIds, idKey }
  }

  async insert(doc) {
    if (this.options.generateIds && !doc[this.options.idKey]) {
      doc[this.options.idKey] = nanoid()
    }
    return this.collection.add(doc)
  }

  async bulkInsert(docs) {
    if (this.options.generateIds) {
      docs.forEach(doc => {
        if (!doc[this.options.idKey]) {
          doc[this.options.idKey] = nanoid()
        }
      })
    }
    return this.collection.bulkAdd(docs, { allKeys: true })
  }

  async update(key, changes) {
    if (has(changes, '$set')) {
      changes = changes.$set
    }
    return this.collection.update(key, changes)
  }

  async remove(key) {
    return this.collection.delete(key)
  }

  async bulkRemove(keys) {
    return this.collection.bulkDelete(keys)
  }

  async findOne(selector) {
    return this.collection.get(selector)
  }

  find(selector) {
    return this.collection.where(selector)
  }
}