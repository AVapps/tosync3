window.XMLHttpRequest.prototype.send = function(data) {
  console.log('send called with :', data)
  this.addEventListener('loadend', evt => {
    console.log('onloadend event', evt)
    console.log(this._method, this._url, this.status, this.statusText, this.response, this.responseText)
  })
  return send.apply(this, arguments)
}

window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
  this._url = url
  this._method = method
  return open.apply(this, arguments)
}

$(document).ajaxComplete(function(event, xhr, settings) {
  console.log(settings.type, xhr.status, xhr.statusText, settings.url, settings.data, xhr, settings)
  if (settings.url === '/Changes/CallbackPartial' && settings.data?.indexOf('SignDay=') !== -1) {
    console.log('Changes sign request detected !')
    console.log('Succcess :', xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200)
  }
})

const $username = document.getElementById('okta-signin-username')
const $password = document.getElementById('okta-signin-password')
$username.value = 'test.cdb@fr.transavia.com'
$username.dispatchEvent(new Event('change', { bubbles: true }))
$password.value = 'zakdgzk-zedzkev'
$password.dispatchEvent(new Event('change', { bubbles: true }))
document.getElementById('okta-signin-submit').click()
