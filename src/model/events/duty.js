import SimpleSchema from 'simpl-schema'
import { solSchema } from './sol.js'
import { dutySubEventSchema } from './dutySubEvent.js'
import { mepSchema } from './mep.js'

const dutySchema = new SimpleSchema({
  events: {
    type: Array
  },
  'events.$': {
    type: SimpleSchema.oneOf(mepSchema, dutySubEventSchema)
  },
  hotel: {
    type: Object,
    optional: true,
    blackbox: true
  }
})

dutySchema.extend(solSchema)

export { dutySchema }
