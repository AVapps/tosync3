import SimpleSchema from 'simpl-schema'
import { eventSchema } from './event.js'
import { peqSchema } from './peq.js'
import { instructionSchema } from './instruction.js'
import { TAGS } from '@/data/tags'

export const solSchema = new SimpleSchema({
  tag: {
    type: String,
    allowedValues: TAGS
  }
})

solSchema.extend(eventSchema)
solSchema.extend(peqSchema)
solSchema.extend(instructionSchema)
