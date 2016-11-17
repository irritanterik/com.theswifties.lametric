/* global Homey */
'use strict'
var lametric = require('../../lib/lametric.js')

const redirect_uri = 'https://callback.athom.com/oauth2/callback/'
var activeGrant

var self = {
  init: function (devices, callback) {
    activeGrant = Homey.manager('settings').get('lametricGrant')
    callback()
  },
  pair: function (socket) {
    Homey.log('LaMetric pairing has started...')
    socket.on('start', function () {
      function handleUrl (error, url) {
        if (error) return
        socket.emit('url', url)
      }

      function handleCode (error, code) {
        if (error) return socket.emit('authorized', false)
        lametric.getToken(Homey.env.CLIENT_ID, Homey.env.CLIENT_SECRET, code, redirect_uri).then(grant => {
          activeGrant = grant
          Homey.manager('settings').set('lametricGrant', grant)
          socket.emit('authorized', true)
        }).catch(reason => {
          socket.emit('authorized', false)
        })
      }

      Homey.manager('cloud').generateOAuth2Callback(
        lametric.getOauthRequestUri(Homey.env.CLIENT_ID, redirect_uri),
        handleUrl,
        handleCode
      )
    })

    socket.on('list_devices', function (data, callback) {
      lametric.getDevices(activeGrant.access_token).then(result => {
        var deviceList = []
        result.forEach(device => {
          deviceList.push({
            name: device.name,
            data: {id: device.id, apiKey: device.api_key, mac: device.mac},
            settings: {ipv4: device.ipv4_internal}
          })
        })
        callback(null, deviceList)
      }).catch(callback)
    })
  },
  added: function (device) {
    Homey.log('added', device)
  },
  deleted: function (device) {
    Homey.log('deleted', device)
  },
  renamed: function (device, name, callback) {
    Homey.log('rename', [device, name])
    lametric.setName(activeGrant.access_token, device.id, name)
    callback()
  },
  settings: function (device, newSettingsObj, oldSettingsObj, changedKeysArr, callback) {
    Homey.log('settings changed', {device: device, newSettingsObj: newSettingsObj, changedKeysArr: changedKeysArr})
    if (newSettingsObj.ipv4) {
      if (!(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(newSettingsObj.ipv4))) {
        return callback('Invalid IP')
      }
    }
    callback(null, true)
  }
}
module.exports = self
