import { Storage } from '@capacitor/storage'
import { useStorageAsync, pausableWatch } from '@vueuse/core'
import { isRef, ref, unref, watch } from 'vue'

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

export const useCapacitorStorageState = (key, initialValue, options = {}) => {
  const {
    flush = 'pre',
    deep = true,
    listenToStorageChanges = false, // Not available
    writeDefaults = true,
  } = options

  const rawInit = unref(initialValue)
  const type = typeof rawInit
  const serializer = type === 'object' ? {
    write: JSON.stringify,
    read: JSON.parse
  } : { write: a => a, read: a => a }

  const state = ref(initialValue)
  const error = ref()
  const isReady = ref(false)
  const isLoading = ref(true)

  async function read() {
    try {
      const k = unref(key)
      isLoading.value = true
      const rawValue = await storage.getItem(k)
      if (rawValue == null) {
        state.value = rawInit
        if (writeDefaults && rawInit !== null) {
          await storage.setItem(k, serializer.write(rawInit))
        }
      } else {
        state.value = await serializer.read(rawValue)
      }
      isReady.value = true
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  read()

  const { pause, resume } = pausableWatch(
    state,
    async () => {
      const k = unref(key)
      try {
        if (state.value == null) {
          await storage.removeItem(k)
        } else {
          await storage.setItem(k, await serializer.write(state.value))
        }
      } catch (e) {
        error.value = e
      }
    },
    {
      flush,
      deep
    }
  )

  if (isRef(key)) {
    watch(
      key,
      async () => {
        pause()
        isReady.value = false
        await read()
        resume()
      }
    )
  }

  return { state, error, isReady, isLoading }
}
