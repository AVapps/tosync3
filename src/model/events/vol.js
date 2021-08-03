import SimpleSchema from 'simpl-schema'
import { mepSchema } from './mep.js'

const volSchema = new SimpleSchema({
  tag: {
    type: String,
    allowedValues: ['vol']
  },
  immat: {
    type: String,
    optional: true
  },
  std: {
    type: SimpleSchema.Integer // Datetime timestamp
  },
  sta: {
    type: SimpleSchema.Integer // Datetime timestamp
  }
})

volSchema.extend(mepSchema)

export { volSchema }
