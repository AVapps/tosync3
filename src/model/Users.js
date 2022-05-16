import { PouchDBCollection } from './PouchDBCollection.js'
import { isString } from 'lodash'

export class UsersCollection extends PouchDBCollection {
  constructor() {
    super('Users', { idFunction: ['crewCode'] })
  }

  async getAll() {
    const { rows } = await this.collection.allDocs({
      include_docs: true,
      attachments: true
    })
    return rows.map(row => row.doc)
  }

  async findOne(options) {
    if (isString(options)) {
      return this.collection.get(options, { attachments: true })
    } else {
      return super.findOne({
        attachments: true,
        ...options
      })
    }
  }
}