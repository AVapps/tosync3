import { RegEx } from 'simpl-schema'

export function checkUserId(userId) {
  if (!/^[A-Z]{3}$/.test(userId)) {
    throw new Error('You must provide a valid userId !')
  }
}

export function checkISODate(isoDate) {
  if (!/^\d{4}-\d\d-\d\d$/.test(isoDate)) {
    throw new Error('You must provide a valid ISO string date !')
  }
}

export function checkISOMonth(isoMonth) {
  if (!/^\d{4}-\d\d/.test(isoMonth)) {
    throw new Error('You must provide a valid ISO string month !')
  }
}

export function validateURL(url) {
  if (!url?.startsWith('http')) {
    url = 'https://' + url
  }
  if (!RegEx.Url.test(url)) {
    return
  }
  try {
    const _url = new URL(url)
    _url.protocol = 'https:'
    return _url.href
  } catch (error) {
    console.log(error)
  }
}