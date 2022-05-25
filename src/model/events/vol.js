import SimpleSchema from 'simpl-schema'
import { mepSchema } from './mep.js'

export const volSchema = new SimpleSchema({
  tag: {
    type: String,
    allowedValues: ['vol']
  },
  immat: {
    type: String,
    optional: true
  },
  std: {
    type: String // Datetime ISO
  },
  sta: {
    type: String // Datetime ISO
  }
})

volSchema.extend(mepSchema)
