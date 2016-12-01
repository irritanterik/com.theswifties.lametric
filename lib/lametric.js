var http = require('http.min')

const apiEndpoint = 'https://developer.lametric.com/api/v2'

exports.apiEndpoint = apiEndpoint

exports.getOauthRequestUri = function (client, redirect_uri) {
  return `${apiEndpoint}/oauth2/authorize?response_type=code&client_id=${client}&redirect_uri=${redirect_uri}&scope=basic+devices_read+devices_write`
}

exports.getDevices = function (token) {
  var options = {
    uri: `${apiEndpoint}/users/me/devices`,
    headers: { Authorization: 'Bearer ' + token }
  }
  return http.json(options).then(result => {
    if (result.errors) return Promise.reject(result.errors[0].message)
    return result
  })
}

exports.getIcons = function () {
  return http.json(`${apiEndpoint}/icons?fields=id,title,code,thumb`).then(result => result.data)
}

exports.getToken = function (client, secret, code, redirect_uri) {
  var options = {
    uri: `${apiEndpoint}/oauth2/token`,
    json: true,
    form: {
      'client_id': client,
      'client_secret': secret,
      'code': code,
      'redirect_uri': redirect_uri,
      'grant_type': 'authorization_code'
    }
  }
  return http.post(options).then(result => result.data)
}

exports.getVolume = function (ip, apiKey) {
  return http.json(`http://dev:${apiKey}@${ip}:8080/api/v2/device/audio`).then(result => {
    if (result.response.statusCode !== 200) return Promise.reject('failure')
    return result.volume
  })
}

exports.sendNotification = function (ip, apiKey, icontype, text, icon, sound) {
  var options = {
    uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/notifications`,
    json: {
      priority: 'warning',
      icon_type: icontype,
      model: {
        cycles: 3,
        frames: [{ text: text }]
      }
    }
  }
  if (icon) { options.json.model.frames[0].icon = icon }
  if (sound) { options.json.model.sound = { category: 'notifications', id: sound, repeat: 1 } }

  return http.post(options).then(result => {
    if (result.response.statusCode !== 201) return Promise.reject('failure')
    return true
  })
}

exports.setName = function (token, deviceId, name) {
  var options = {
    uri: `${apiEndpoint}/users/me/devices/${deviceId}`,
    headers: { Authorization: 'Bearer ' + token },
    json: { name: name }
  }
  return http.put(options).then(result => {
    if (result.errors) return Promise.reject(result.errors[0].message)
    return result
  })
}

exports.setVolume = function (ip, apiKey, volume) {
  var options = {
    uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/audio`,
    json: { volume: volume }
  }
  return http.put(options).then(result => {
    if (result.response.statusCode !== 200) return Promise.reject('failure')
    return true
  })
}
