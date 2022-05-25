import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
import { get, has, isUndefined, isString, isArray } from 'lodash'

PouchDB.plugin(PouchDBFind)

export class PouchDBCollection {
  constructor (name, options = {}) {
    this.name = name
    this.initDb()
    let { generateIds = true, idKey = '_id', idFunction = null } = options
    if (isArray(idFunction)) {
      const paths = idFunction
      idFunction = (doc) => {
        return paths.map(path => {
          return get(doc, path)
        }).join('.')
      }
    }
    this.options = { generateIds, idKey, idFunction }
  }

  initDb() {
    this.collection = new PouchDB(`CrewSync.${this.name}`, {
      adapter: 'idb',
      auto_compaction: true
    })
  }

  async clear() {
    const docs = await this.collection.allDocs({ include_docs: true })
    const toDelete = docs.rows.map(row => ({ _id: row.id, _rev: row.doc._rev, _deleted: true }))
    await this.collection.bulkDocs(toDelete)
    return this.collection.compact()
  }

  async insert(doc) {
    if (this.options.generateIds && !doc[this.options.idKey]) {
      if (this.hasIdFunction()) {
        doc[this.options.idKey] = this.getId(doc)
        return this.collection.put(doc)
      } else {
        return this.collection.post(doc) // auto-generate id
      }
    }
    return this.collection.put(doc)
  }

  async upsert(doc) {
    if (doc._id) {
      if (!doc._rev) {
        let oldDoc
        try {
          oldDoc = await this.collection.get(doc._id)
        } catch (err) {
          if (err.name === 'not_found') {
            return this.insert(doc)
          } else {
            throw err
          }
        }
        doc._rev = oldDoc._rev
      }
      return this.collection.put(doc)
    } else {
      this.insert(doc)
    }
  }

  async bulkInsert(docs) {
    if (this.options.generateIds) {
      const hasIdFunction = this.hasIdFunction()
      docs.forEach(doc => {
        if (!doc[this.options.idKey] && hasIdFunction) {
          doc[this.options.idKey] = this.getId(doc)
        }
      })
    }
    return this.collection.bulkDocs(docs)
  }

  async update(key, changes) {
    if (isUndefined(changes)) {
      if (!has(key, '_id')) {
        throw new Error('You must provide a doc to update with an _id field !')
      }
      if (!has(key, '_rev')) {
        throw new Error('You must provide a doc to update with a _rev field !')
      }
      return this.collection.put(key)
    }

    if (!isString(key)) {
      throw new Error('_id must be of type string !')
    }

    if (has(changes, '$set')) {
      changes = changes.$set
    }

    const doc = { _id: key, ...changes }
    const oldDoc = await this.collection.get(doc._id)
    doc._rev = oldDoc._rev
    return this.collection.put(doc)
  }

  async remove(key, _rev) {
    if (isString(key)) {
      if (isUndefined(_rev)) {
        const oldDoc = await this.collection.get(key)
        return this.collection.remove(key, oldDoc._rev)
      } else if (isString(_rev)) {
        return this.collection.remove(key, _rev)
      }
    } else {
      return this.collection.remove(key)
    }
  }

  async bulkRemove(docs) {
    const docsToRemove = docs.map(async doc => {
      if (isString(doc)) {
        const oldDoc = await this.collection.get(doc)
        oldDoc._deleted = true
        return oldDoc
      } else if (has(doc, '_id') && has(doc, '_rev')) {
        doc._deleted = true
        return doc
      } else {
        throw new Error('_id or _rev not found !')
      }
    })
    return this.collection.bulkDocs(docsToRemove)
  }

  async findOne(options) {
    if (isString(options)) {
      return this.collection.get(options)
    } else {
      options.limit = 1
      const found = await this.find(options)
      return found.length ? found[0] : undefined
    }
  }

  async find(options) {
    const result = await this.collection.find(options)
    return result.docs
  }

  getId(doc) {
    if (this.hasIdFunction()) {
      return this.options.idFunction(doc)
    }
  }

  hasIdFunction() {
    return typeof this.options.idFunction === 'function'
  }
}
