import SimpleSchema from 'simpl-schema'

const trainingDetailSchema = new SimpleSchema({
  trainingCode: {
    type: String
  },
  instructors: {
    type: Array,
  },
  'instructors.$': {
    type: String,
  },
  trainees: {
    type: Array,
  },
  'trainees.$': {
    type: String,
  },
  standins: {
    type: Array,
  },
  'standins.$': {
    type: String,
  }
})

export const instructionSchema = new SimpleSchema({
  instruction: {
    type: Array,
    optional: true
  },
  'instruction.$': {
    type: trainingDetailSchema,
    optional: true
  }
})