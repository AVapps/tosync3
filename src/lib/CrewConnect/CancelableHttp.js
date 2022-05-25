import { HTTP } from '@awesome-cordova-plugins/http'
import { cancelable, CancelablePromise } from 'cancelable-promise'

export const Http = {
  get(options = {}) {
    return request({
      method: 'get',
      ...options
    })
  },
  post(options = {}) {
    return request({
      method: 'post',
      ...options
    })
  },
  request(options = {}) {
    return request(options)
  }
}

function request(options) {
  const op = {
    method: 'get',
    // data: '',
    // params: '',
    serializer: 'json',
    responseType: 'json',
    timeout: 30,
    followRedirect: true,
    // headers: {},
    ...options
  }

  return new CancelablePromise((resolve, reject, onCancel) => {
    const requestId = HTTP.sendRequest(op.url, op,
      (response) => {
        if (response.status === 200) {
          resolve(response)
        } else {
          reject(response)
        }
      },
      (error) => {
        reject(error)
      })
    
    onCancel(() => {
      HTTP.abort(requestId,
        ({ aborted }) => {
          if (aborted) {
            console.log('A request has been canceled by user')
          } else {
            console.log('A request couldn\'t be aborted')
          }
        },
        (response) => {
          console.log('An error has occured during request abort !', response.error)
        })
    })
  })
}