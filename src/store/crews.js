import { defineStore } from 'pinia'
import { CrewsCollection } from '@/model/CrewsCollection.js'
import { computed, reactive, readonly, ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { omit } from 'lodash'

export const useCrews = defineStore('crews', () => {
  const db = new CrewsCollection()

  const { state: crewsList,  isReady, error } = useAsyncState(async () => db.getAll(), [])

  const crewsMap = computed(() => new Map(crewsList.value.map(doc => [doc._id, doc])))

  async function importList(list, { overwriteTitles = false }) {
    const { inserted, updated, removed } = await db.importList(list, { overwriteTitles })
    inserted.forEach(crew => crewsMap.value.set(crew._id, crew))
    updated.forEach(crew => crewsMap.value.set(crew._id, crew))
    removed.forEach(crew => crewsMap.value.delete(crew._id))
  }

  return {
    error,
    isReady,
    map: crewsMap,
    list: readonly(crewsList),
    importList,
    get: _id => omit(crewsMap.value.get(_id), '_rev')
  }
})