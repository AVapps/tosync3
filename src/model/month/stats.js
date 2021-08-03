import SimpleSchema from 'simpl-schema'

const basicStatsSchema = new SimpleSchema({
  hdv: {
    type: Number
  },
  eHS: {
    type: Number
  },
  '30e': {
    type: Number
  },
  totalBrut: {
    type: Number,
    optional: true
  }
})

export const statsSchema = new SimpleSchema({
  AF: {
    type: basicStatsSchema
  },
  TO: {
    type: basicStatsSchema
  }
})
