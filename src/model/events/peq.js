import SimpleSchema from 'simpl-schema'

const crewSchema = new SimpleSchema({
  crewCode: {
    type: String,
    regEx: /^[A-Z]{3}$/
  },
  fct: {
    type: String,
    optional: true
  },
  cpt: {
    type: Boolean,
    optional: true
  }
})

export const peqSchema = new SimpleSchema({
  peq: {
    type: Array,
    optional: true
  },
  'peq.$': {
    type: crewSchema
  }
})
