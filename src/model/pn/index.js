import SimpleSchema from 'simpl-schema'

export const pnSchema = new SimpleSchema({
  username: {
    type: String,
    regEx: /(^[A-Z]{3}$)|(^m[0-9]{6}$)/
  },
  fonction: {
    type: String
  },
  nom: {
    type: String
  },
  prenom: {
    type: String,
  },
  phone: {
    type: SimpleSchema.RegEx.Phone,
    optional: true
  },
  email: {
    type: SimpleSchema.RegEx.Email,
    optional: true
  }
})