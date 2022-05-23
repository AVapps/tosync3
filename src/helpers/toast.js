import { toastController } from '@ionic/vue'
import { warningOutline } from 'ionicons/icons'

export async function toast(options = {}) {
  const _toast = await toastController.create({
    duration: 2000,
    translucent: true,
    ...options
  })
  await _toast.present()
  return _toast
}

export function toastError(error, options = {}) {
  return toast({
    message: error.message ?? error.error ?? "Une erreur s'est produite",
    color: 'danger',
    translucent: false,
    icon: warningOutline,
    ...options
  })
}

export function toastHttpError(error, options = {}) {
  if (error.error && error.status) {
    let msg
    switch (error.status) {
      case -2:
        msg = 'Erreur SSL' // SSL_EXCEPTION
        break
      case -3:
        msg = 'Server introuvable' // SERVER_NOT_FOUND
        break
      case -4:
        msg = 'Délai d\'expiration dépassé' // TIMEOUT
        break
      case -5:
        msg = 'URL non supportée' // UNSUPPORTED_URL
        break
      case -6:
        msg = 'Non connecté' // NOT_CONNECTED
        break
      case -7:
        msg = 'Erreur lors du traitement de la requète' // POST_PROCESSING_FAILED
        break
      case -8:
        msg = 'Requète annulée' // ABORTED
        break
      case 400:
        msg = 'Requète incorrecte' // Bad request
        break
      case 401:
        msg = 'Authentification nécessaire' // Unauthorized
        break
      case 403:
        msg = 'Accès non autorisé' // Forbidden
        break
      case 404:
        msg = 'Ressource introuvable' // Not Found
        break
      case 503:
        msg = 'Serveur indisponible' // Service Unavailable
        break
      default:
        msg = error.error
    }
    return toastError({
      message: `${msg} [${error.status}]`
    })
  }
  return toastError(error, options)
}

export async function tryAndToastError(task) {
  try {
    await task()
  } catch (error) {
    toastError(error)
  }
}

export async function tryAndToastHttpError(task) {
  try {
    await task()
  } catch (error) {
    toastHttpError(error)
  }
}