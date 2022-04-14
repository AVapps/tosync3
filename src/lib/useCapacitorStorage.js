import { Storage } from '@capacitor/storage'
import { useStorageAsync } from '@vueuse/core'

const storage = {
  async getItem(key) {
    const { value } = await Storage.get({ key })
    return value
  },
  async setItem(key, value) {
    return await Storage.set({ key, value })
  },
  async removeItem(key) {
    return await Storage.remove({ key })
  }
}

export const useCapacitorStorage = (key, initialValue) => {
  const dataRef = useStorageAsync(
    key,
    initialValue,
    storage,
    {
      listenToStorageChanges: false
    }
  )
  return dataRef
}
