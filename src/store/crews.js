import { defineStore } from 'pinia'
import { CrewsCollection } from '@/model/CrewsCollection.js'
import { computed, reactive, readonly, ref } from 'vue'

export const useCrews = defineStore('crews', () => {
  const db = new CrewsCollection()
  const crewsMap = reactive(new Map())
  const isReady = ref(false)
  const error = ref()

  async function loadCache() {
    const docs = await db.getAll()
    docs.forEach(doc => crewsMap.set(doc._id, doc))
  }

  async function importList(list, { overwriteTitles = false }) {
    const { inserted, updated, removed } = await db.importList(list, { overwriteTitles })
    inserted.forEach(crew => crewsMap.set(crew._id, crew))
    updated.forEach(crew => crewsMap.set(crew._id, crew))
    removed.forEach(crew => crewsMap.delete(crew._id))
  }

  loadCache()
    .then(() => isReady.value = true)
    .catch(e => {
      console.log('crews.loadCache error', e)
      error.value = e
    })

  return {
    error,
    isReady,
    index: readonly(crewsMap),
    loadCache,
    list: computed(() => Array.from(crewsMap.values())),
    importList
  }
})