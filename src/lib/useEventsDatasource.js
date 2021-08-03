import { EventsDatasourceClient } from '@/model/EventsDatasourceClient'

let instance

export const useEventsDatasource = () => {
  if (!instance) {
    instance = new EventsDatasourceClient()
  }
  return instance
}
