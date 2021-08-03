import SimpleSchema from 'simpl-schema'
import { profileSchema } from './profile'
import { statsSchema } from './stats'

export const monthSchema = new SimpleSchema({
  _id: {
    type: String,
    optional: true
  },
  _rev: {
    type: String,
    optional: true
  },
  userId: {
    type: String
  },
  month: {
    type: String,
    regEx: /^\d{4}-\d\d$/
  },
  profile: {
    type: profileSchema,
    optional: true
  },
  stats: {
    type: statsSchema
  },
  // Moyenne rému jours de délégation syndicale
  Hcsr: {
    type: Number,
    optional: true
  },
  PVDel: {
    type: Number,
    optional: true
  },
  HCDel: {
    type: Number,
    optional: true
  }
})
