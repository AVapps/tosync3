import SimpleSchema from 'simpl-schema'
import { TAGS } from '@/data/tags'

export const dutySubEventSchema = new SimpleSchema({
  tag: {
    type: String,
    allowedValues: TAGS
  },
  slug: {
    type: String
  },
  start: {
    type: String // Datetime ISO
  },
  end: {
    type: String // Datetime ISO
  },

  // Optional fields
  opsLegCrewId: {
    type: String,
    optional: true
  },
  category: {
    type: String,
    optional: true
  },
  summary: {
    type: String,
    optional: true
  },
  remark: {
    type: String,
    optional: true
  },
  created: {
    type: SimpleSchema.Integer, // Datetime timestamp
    optional: true
  },
  updated: {
    type: SimpleSchema.Integer, // Datetime timestamp
    optional: true
  }
})
