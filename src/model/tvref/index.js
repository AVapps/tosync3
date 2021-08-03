import SimpleSchema from 'simpl-schema'

export const tvrefSchema = new SimpleSchema({
  _id: {
    type: String
  },
  serie: {
    type: String,
    allowedValues: ['AF', 'TOA', 'TOB']
  },
  saison: {
    type: String,
    allowedValues: ['S', 'W']
  },
  route: {
    type: String,
    regEx: /^[A-Z]{3}-[A-Z]{3}$/
  },
  mois: {
    type: String,
    regEx: /^\d{4}-\d\d$/
  },
  tr: {
    type: Number
  }
})
