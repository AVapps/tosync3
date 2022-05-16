import SimpleSchema from 'simpl-schema'

export const hotelSchema = new SimpleSchema({
  opsLegCrewId: {
    type: String,
    optional: true
  },
  // tag: {
  //   type: String,
  //   allowedValues: [ 'hotel' ]
  // },
  name: {
    type: String,
    optional: true
  },
  summary: {
    type: String,
    optional: true
  },
  address: {
    type: String,
    optional: true
  },
  email: {
    type: SimpleSchema.RegEx.Email,
    optional: true
  },
  phone: {
    type: SimpleSchema.RegEx.Phone,
    optional: true
  },
  room: {
    type: String,
    optional: true
  }
})