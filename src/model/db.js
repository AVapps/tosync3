import Dexie from 'dexie'

const db = new Dexie('CrewSync')
db.version(1).stores({
  events: `_id,&slug,[userId+start+end]`,
  pn: `username,nom,prenom`,
  tvref: `_id,[serie+saison+dept+dest+mois]`,
  stats: `_id,[userId+mois]`,
  profil: `_id,[userId+mois]`
})

export { db }