// import Dexie from 'dexie'

// const db = new Dexie('CrewSync')
// db.version(1).stores({
//   events: `_id,&slug,[userId+start+end]`,
//   pn: `username,nom,prenom`,
//   tvref: `_id,[serie+saison+dept+dest+mois]`,
//   stats: `_id,[userId+mois]`,
//   profil: `_id,[userId+mois]`
// })

import PouchDB from 'pouchdb'

const db = new PouchDB('CrewSync', {
  adapter: 'idb'
})

export { db }