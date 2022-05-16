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

export async function toastError(error, options = {}) {
  return toast({
    message: error.message ?? "Une erreur s'est produite",
    color: 'danger',
    translucent: false,
    icon: warningOutline,
    ...options
  })
}

export async function tryAndToastError(task) {
  try {
    await task()
  } catch (error) {
    console.log(error)
    toastError(error)
  }
}