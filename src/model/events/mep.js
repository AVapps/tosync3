import SimpleSchema from 'simpl-schema'

export const mepSchema = new SimpleSchema({
  tag: {
    type: String,
    allowedValues: ['mep']
  },
  category: {
    type: String,
    optional: true
  },
  num: {
    type: String,
    optional: true
  },
  type: {
    type: String,
    optional: true
  },
  from: {
    type: String,
    regEx: /^[A-Z]{3}$/
  },
  to: {
    type: String,
    regEx: /^[A-Z]{3}$/
  },
  depTz: {
    type: String,
    optional: true
  },
  arrTz: {
    type: String,
    optional: true
  },
  fonction: {
    type: String,
    regEx: /^[A-Z]{3}$/,
    optional: true
  },
  remarks: {
    type: String,
    optional: true
  },
  start: {
    type: SimpleSchema.Integer // Datetime timestamp
  },
  end: {
    type: SimpleSchema.Integer // Datetime timestamp
  },
  remu: {
    type: Object,
    optional: true,
    blackbox: true
  }
})
