var http = require('http.min')

const apiEndpoint = 'https://developer.lametric.com/api/v2'

var self = module.exports = { // eslint-disable-line
  cloud: {
    getOauthRequestUri: function (client, redirect_uri) {
      return `${apiEndpoint}/oauth2/authorize?response_type=code&client_id=${client}&redirect_uri=${redirect_uri}&scope=basic+devices_read+devices_write`
    },
    getDevices: function (token) {
      var options = {
        uri: `${apiEndpoint}/users/me/devices`,
        headers: { Authorization: 'Bearer ' + token }
      }
      return http.json(options).then(result => {
        if (result.errors) return Promise.reject(result.errors[0].message)
        return result
      })
    },
    getIcons: function () {
      return http.json(`${apiEndpoint}/icons?fields=id,title,code,thumb`).then(result => result.data)
    },
    getToken: function (client, secret, code, redirect_uri) {
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
    },
    setName: function (token, deviceId, name) {
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
  },
  device: {
    doAppAction: function (ip, apiKey, appId, action, params) {
      return self.device.getWidgets(ip, apiKey).then(widgets => {
        var widgetId = widgets.filter(widget => widget.package === appId)[0].widget
        var options = {
          uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/apps/${appId}/widgets/${widgetId}/actions`,
          json: { id: action }
        }
        if (params) { options.json.params = params }
        return http.post(options).then(result => {
          if (result.response.statusCode !== 201) return Promise.reject(`failure ${result.response.statusCode}`)
          return true
        })
      })
    },
    doWidgetAction: function (ip, apiKey, widgetId, action, params) {
      return self.device.getWidgets(ip, apiKey).then(widgets => {
        var appId = widgets.filter(widget => widget.widget === widgetId)[0].package
        var options = {
          uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/apps/${appId}/widgets/${widgetId}/actions`,
          json: { id: action }
        }
        if (params) { options.json.params = params }
        return http.post(options).then(result => {
          if (result.response.statusCode !== 201) return Promise.reject(`failure ${result.response.statusCode}`)
          return true
        })
      })
    },
    getApps: function (ip, apiKey) {
      return http.json(`http://dev:${apiKey}@${ip}:8080/api/v2/device/apps`).then(result => {
        var apps = []
        Object.keys(result).forEach(appId => {
          var app = result[appId]
          app.id = appId
          apps.push(app)
        })
        return apps
      })
    },
    getVolume: function (ip, apiKey) {
      return http.json(`http://dev:${apiKey}@${ip}:8080/api/v2/device/audio`).then(result => {
        return result.volume
      })
    },
    getWidgets: function (ip, apiKey) {
      return self.device.getApps(ip, apiKey).then(apps => {
        var widgets = []
        apps.forEach(app => {
          Object.keys(app.widgets).forEach(widgetid => {
            var widgetObject = app.widgets[widgetid]
            var widget = {
              package: app.package,
              widget: widgetid
            }
            widget.title = widgetObject.settings ? widgetObject.settings._title : app.package.split('.').splice(-1).toString()
            if (widget.title.length === 32 && app.package.slice(0, 12) === 'com.lametric') widget.title += ` (${app.vendor})`
            widgets.push(widget)
          })
        })
        return widgets
      })
    },
    sendNotification: function (ip, apiKey, icontype, text, icon, sound) {
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
    },
    setVolume: function (ip, apiKey, volume) {
      var options = {
        uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/audio`,
        json: { volume: volume }
      }
      return http.put(options).then(result => {
        if (result.response.statusCode !== 200) return Promise.reject(`failure ${result.response.statusCode}`)
        return true
      })
    },
    showApp: function (ip, apiKey, appId) {
      return self.device.getWidgets(ip, apiKey).then(widgets => {
        // find widget by app id
        var widgetId = widgets.filter(widget => widget.package === appId)[0].widget
        var options = {
          uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/apps/${appId}/widgets/${widgetId}/activate`
        }
        return http.put(options).then(result => {
          if (result.response.statusCode !== 200) return Promise.reject(`failure ${result.response.statusCode}`)
          return true
        })
      })
    },
    showWidget: function (ip, apiKey, widgetId) {
      return self.device.getWidgets(ip, apiKey).then(widgets => {
        // find app by widget id
        var appId = widgets.filter(widget => widget.widget === widgetId)[0].package
        var options = {
          uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/apps/${appId}/widgets/${widgetId}/activate`
        }
        return http.put(options).then(result => {
          if (result.response.statusCode !== 200) return Promise.reject(`failure ${result.response.statusCode}`)
          return true
        })
      })
    },
    showWidgetNext: function (ip, apiKey) {
      var options = {
        uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/apps/next`
      }
      return http.put(options).then(result => {
        if (result.response.statusCode !== 200) return Promise.reject(`failure ${result.response.statusCode}`)
        return true
      })
    },
    showWidgetPrevious: function (ip, apiKey) {
      var options = {
        uri: `http://dev:${apiKey}@${ip}:8080/api/v2/device/apps/prev`
      }
      return http.put(options).then(result => {
        if (result.response.statusCode !== 200) return Promise.reject(`failure ${result.response.statusCode}`)
        return true
      })
    }
  }
}
