import SimpleSchema from 'simpl-schema'

export const profileSchema = new SimpleSchema({
  fonction: {
    type: String,
    allowedValues: ['CDB', 'OPL']
  },
  categorie: {
    type: String,
    allowedValues: ['A', 'B', 'C']
  },
  grille: {
    type: String,
    allowedValues: ['OPLA', 'OPLB', 'OPLC', 'CDB']
  },
  atpl: {
    type: Boolean
  },
  anciennete: {
    type: SimpleSchema.Integer,
    min: 0,
    optional: true
  },
  echelon: {
    type: SimpleSchema.Integer,
    min: 1,
    max: 10,
    optional: true
  },
  classe: {
    type: SimpleSchema.Integer,
    min: 1,
    max: 5
  }
})
