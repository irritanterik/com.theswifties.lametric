/* global Homey */
'use strict'

var http = require('http.min')
var api_url = 'https://developer.lametric.com/api/v2'
var redirect_uri = 'https://callback.athom.com/oauth2/callback/'
// var devices = {}

var self = {
  init: function (devices, callback) {
    // use this for debugging if you don't have the env.json file
    // Homey.env.CLIENT_ID = 'my_id'
    // Homey.env.CLIENT_SECRET = 'my_secret'

    callback()
  },
  pair: function (socket) {
    Homey.log('LaMetric pairing has started...')
    socket.on('start', function () {
      // request an authorization url, and forward it to the front-end
      Homey.manager('cloud').generateOAuth2Callback(
        api_url + '/oauth2/authorize?response_type=code&client_id=' + Homey.env.CLIENT_ID + '&redirect_uri=' + redirect_uri + '&scope=basic+devices_read+devices_write',
        // this function is executed when we got the url to redirect the user to
        function (error, url) {
          if (error) return
          Homey.log('Got url!', url)
          socket.emit('url', url)
        },
        // this function is executed when the authorization code is received (or failed to do so)
        function (error, code) {
          if (error) {
            Homey.error(error)
            socket.emit('authorized', false)
            return
          }

          Homey.log('Got authorization code!', code)
          var options = {
            uri: api_url + '/oauth2/token',
            form: {
              'client_id': Homey.env.CLIENT_ID,
              'client_secret': Homey.env.CLIENT_SECRET,
              'code': code,
              'redirect_uri': redirect_uri,
              'grant_type': 'authorization_code'
            },
            json: true
          }

          // swap the authorization code for a token
          http.post(options).then(function (result) {
            Homey.manager('settings').set('lametricGrant', result.data)
            Homey.log('Authorized!')
            socket.emit('authorized', true)
          }).catch(function (reason) {
            socket.emit('authorized', false)
          })
        }
      )
    })

    socket.on('list_devices', function (data, callback) {
      Homey.log('list_devices')
      var grant = Homey.manager('settings').get('lametricGrant')
      var options = {
        uri: api_url + '/users/me/devices',
        headers: { Authorization: 'Bearer ' + grant.access_token },
        json: true
      }
      Homey.log('get options', options)
      http.get(options).then(function (result) {
        Homey.log('devices', result.data)
        var deviceList = []
        result.data.forEach(device => {
          deviceList.push({
            name: device.name,
            data: {id: device.id, apiKey: device.api_key, ipv4: device.ipv4_internal, mac: device.mac}
          })
        })
        callback(null, deviceList)
      }).catch(function (error) {
        Homey.log('error', error)
        callback(error)
      })
    })
  },
  added: function (device) {
    Homey.log('added', device)
    // initDevice(device)
  },
  deleted: function (device) {
    Homey.log('deleted', device)
    // uninitDevice(device)
  },
  renamed: function (device, name, callback) {
    Homey.log('rename vehicle', [device, name])
    // devices[device.id].name = name
    callback()
  }
}

/*
  Initialize a device by creating an object etc
*/
// function initDevice (device_data) {
//   // create the device object
//   devices[ device_data.id ] = {
//     state: {
//       target_temperature: null,
//       measure_temperature: null
//     }
//   }
//
//   // add webhook listener
//   registerWebhook(device_data)
//
//   // get initial state
//   getThermosmart(device_data)
//
//   // update state every 15 mins
//   devices[ device_data.id ].pollInterval = setInterval(function () {
//     getThermosmart(device_data)
//   }, 1000 * 60 * 15)
// }
//
// function uninitDevice (device_data) {
//   if (devices[ device_data.id ]) {
//     if (devices[ device_data.id ].pollInterval) {
//       clearInterval(devices[ device_data.id ].pollInterval)
//     }
//     delete devices[ device_data.id ]
//   }
// }
//
// /*
//   Listen on a webook
//   TODO: test with > 1 devices
// */
// function registerWebhook (device_data) {
//   Homey.manager('cloud').registerWebhook(Homey.env.WEBHOOK_ID, Homey.env.WEBHOOK_SECRET, {
//     thermosmart_id: device_data.id
//   }, function onMessage (args) {
//     Homey.log('Incoming webhook for Thermosmart', device_data.id, args)
//
//     var device = devices[ device_data.id ]
//     if (typeof device == 'undefined') return callback(new Error('invalid_device'))
//
//     if (((new Date()) - device.lastUpdated) < (30 * 1000)) {
//       return Homey.log('Ignored webhook, just updated the Thermostat!')
//     }
//
//     if (args.body.target_temperature && args.body.target_temperature != device.state.target_temperature) {
//       device.state.target_temperature = args.body.target_temperature
//       self.realtime(device_data, 'target_temperature', device.state.target_temperature)
//     }
//
//     if (args.body.room_temperature && args.body.room_temperature != device.state.measure_temperature) {
//       device.state.measure_temperature = args.body.room_temperature
//       self.realtime(device_data, 'measure_temperature', device.state.measure_temperature)
//     }
//   }, function callback () {
//     Homey.log('Webhook registered for Thermosmart', device_data.id)
//   })
// }

module.exports = self
