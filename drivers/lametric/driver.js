/* global Homey */
'use strict'
var lametric = require('../../lib/lametric.js')
var util = require('../../lib/util.js')

const redirect_uri = 'https://callback.athom.com/oauth2/callback/'
var activeGrant

var self = {
  init: function (devices, callback) {
    activeGrant = Homey.manager('settings').get('lametricGrant')
    callback()
  },
  pair: function (socket) {
    util.debugLog('LaMetric pairing has started...')
    socket.on('start', function () {
      function handleUrl (error, url) {
        if (error) return
        socket.emit('url', url)
      }

      function handleCode (error, code) {
        if (error) return socket.emit('authorized', false)
        lametric.cloud.getToken(Homey.env.CLIENT_ID, Homey.env.CLIENT_SECRET, code, redirect_uri).then(grant => {
          activeGrant = grant
          Homey.manager('settings').set('lametricGrant', grant)
          socket.emit('authorized', true)
        }).catch(reason => {
          socket.emit('authorized', false)
        })
      }

      Homey.manager('cloud').generateOAuth2Callback(
        lametric.cloud.getOauthRequestUri(Homey.env.CLIENT_ID, redirect_uri),
        handleUrl,
        handleCode
      )
    })

    socket.on('list_devices', function (data, callback) {
      lametric.cloud.getDevices(activeGrant.access_token).then(result => {
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
    util.debugLog('added', device)
  },
  deleted: function (device) {
    util.debugLog('deleted', device)
  },
  renamed: function (device, name, callback) {
    util.debugLog('rename', [device, name])
    lametric.cloud.setName(activeGrant.access_token, device.id, name)
    callback()
  },
  settings: function (device, newSettingsObj, oldSettingsObj, changedKeysArr, callback) {
    util.debugLog('settings changed', {device: device, newSettingsObj: newSettingsObj, changedKeysArr: changedKeysArr})
    if (newSettingsObj.ipv4) {
      if (!(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(newSettingsObj.ipv4))) {
        return callback('Invalid IP')
      }
    }
    callback(null, true)
  },
  capabilities: {
    volume_set: {
      get: function (device, callback) {
        util.debugLog('get', device)
        module.exports.getSettings(device, (error, settings) => {
          if (error) return callback(error)
          lametric.device.getVolume(settings.ipv4, device.apiKey).then(volume => {
            callback(null, volume / 100)
          }).catch(callback)
        })
      },
      set: function (device, volume, callback) {
        util.debugLog('set', device, volume)
        module.exports.getSettings(device, (error, settings) => {
          if (error) return callback(error)
          lametric.device.setVolume(settings.ipv4, device.apiKey, volume * 100).then(result => {
            module.exports.realtime(device, 'volume_set', volume)
            callback(null, volume)
          }).catch(callback)
        })
      }
    }
  }
}
module.exports = self
