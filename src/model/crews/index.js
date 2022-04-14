import SimpleSchema from 'simpl-schema'

export const crewSchema = new SimpleSchema({
  _id: {
    type: String,
    regEx: /(^[A-Z]{3}$)|(^m[0-9]{6}$)/
  },
  title: {
    type: String
  },
  contractRoles: {
    type: String
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  firstPhoneNumber: {
    type: SimpleSchema.RegEx.Phone,
    optional: true
  },
  secondPhoneNumber: {
    type: SimpleSchema.RegEx.Phone,
    optional: true
  },
  photoThumbnail: {
    type: String,
    optional: true
  },
  email: {
    type: SimpleSchema.RegEx.Email,
    optional: true
  }
})