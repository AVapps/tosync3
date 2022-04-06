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