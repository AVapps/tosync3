import SimpleSchema from 'simpl-schema'

export const eventSchema = new SimpleSchema({
  _id: {
    type: String
  },
  _rev: {
    type: String
  },
  userId: {
    type: String
  },
  // tag: {
  //   type: String,
  //   allowedValues: TAGS
  // },
  slug: {
    type: String
  },
  start: {
    type: SimpleSchema.Integer // Datetime timestamp
  },
  end: {
    type: SimpleSchema.Integer // Datetime timestamp
  },

  // Optional fields
  remu: {
    type: Object,
    optional: true,
    blackbox: true
  },
  category: {
    type: String,
    optional: true
  },
  summary: {
    type: String,
    optional: true
  },
  remarks: {
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
