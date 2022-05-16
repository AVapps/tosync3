import SimpleSchema from 'simpl-schema'
import { solSchema } from './sol.js'
import { dutySubEventSchema } from './dutySubEvent.js'
import { mepSchema } from './mep.js'
import { hotelSchema } from './hotel.js'

const dutySchema = new SimpleSchema({
  events: {
    type: Array
  },
  'events.$': {
    type: SimpleSchema.oneOf(mepSchema, dutySubEventSchema)
  },
  hotel: {
    type: hotelSchema,
    optional: true
  },
  opsLegCrewId: {
    type: String,
    optional: true
  },
})

dutySchema.extend(solSchema)

export { dutySchema }
