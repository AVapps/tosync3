import { alertController } from '@ionic/vue'
import { validateURL } from '@/helpers/check'
import { toastError } from './toast'

export const useServerUrlPrompt = () => {
  return async ({ header, message, value, placeholder }) => {
    const alert = await alertController
      .create({
        header,
        message,
        inputs: [
          {
            name: 'serverUrl',
            value,
            type: 'url',
            placeholder: placeholder ?? '',
          }
        ],
        buttons: [
          {
            text: 'Fermer',
            role: 'cancel'
          },
          {
            text: 'Ok',
            role: 'confirm',
            handler: ({ serverUrl }) => {
              console.log(serverUrl)
              const validatedUrl = validateURL(serverUrl)
              console.log(validatedUrl)
              if (!validatedUrl) {
                toastError({
                  message: 'Adresse invalide !'
                })
                return false
              } else {
                return { validatedUrl }
              }
            }
          }
        ]
      })
    await alert.present()
    return alert.onDidDismiss()
  }
}