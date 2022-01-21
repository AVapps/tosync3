import SimpleSchema from 'simpl-schema'

const crewSchema = new SimpleSchema({
  crewCode: {
    type: String,
    regEx: /^[A-Z]{3}$/
  },
  name: {
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
    type: Object,
    optional: true
  },

  'peq.pnt': {
    type: Array,
    optional: true
  },
  'peq.pnt.$': {
    type: crewSchema
  },

  'peq.pnc': {
    type: Array,
    optional: true
  },
  'peq.pnc.$': {
    type: crewSchema
  },

  'peq.mep': {
    type: Array,
    optional: true
  },
  'peq.mep.$': {
    type: crewSchema
  }
})

export const groundCrewSchema = new SimpleSchema({
  peq: {
    type: Object,
    optional: true
  },

  'peq.sol': {
    type: Array,
    optional: true
  },
  'peq.sol.$': {
    type: crewSchema
  },

  'peq.mep': {
    type: Array,
    optional: true
  },
  'peq.mep.$': {
    type: crewSchema
  }
})
