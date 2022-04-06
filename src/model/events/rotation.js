import SimpleSchema from 'simpl-schema'
import { eventSchema } from './event.js'

export const rotationSchema = new SimpleSchema({
  tag: {
    type: String,
    allowedValues: ['rotation']
  }
  // sv: []
})

rotationSchema.extend(eventSchema)
