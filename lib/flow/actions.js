/* global Homey */
var lametric = require('../lametric.js')
var util = require('../util.js')
var autocompleteIcons
var widgetsCache = {}

exports.init = function () {
  Homey.manager('flow').on('action.alarmClockSet', onAlarmClockSet)
  Homey.manager('flow').on('action.alarmClockUnset', onAlarmClockUnset)
  Homey.manager('flow').on('action.notificationText', onNotificationText)
  Homey.manager('flow').on('action.notificationTextIcon', onNotificationTextIcon)
  Homey.manager('flow').on('action.notificationTextIcon.icon.autocomplete', onAutocompleteIcon)
  Homey.manager('flow').on('action.notificationTextIconSound', onNotificationTextIconSound)
  Homey.manager('flow').on('action.notificationTextIconSound.icon.autocomplete', onAutocompleteIcon)
  Homey.manager('flow').on('action.notificationTextIconSound.sound.autocomplete', onAutocompleteSound)
  Homey.manager('flow').on('action.notificationTextSound', onNotificationTextSound)
  Homey.manager('flow').on('action.notificationTextSound.sound.autocomplete', onAutocompleteSound)
  Homey.manager('flow').on('action.radioAction', onRadioAction)
  Homey.manager('flow').on('action.setVolume', onSetVolume)
  Homey.manager('flow').on('action.showWidget', onShowWidget)
  Homey.manager('flow').on('action.showWidget.widget.autocomplete', onAutoCompleteWidget)
  Homey.manager('flow').on('action.showWidgetNextPrev', onShowWidgetNextPrev)
  Homey.manager('flow').on('action.stopwatchAction', onStopwatchAction)
  Homey.manager('flow').on('action.timerAction', onTimerAction)
  Homey.manager('flow').on('action.timerConfig', onTimerConfig)
  Homey.manager('flow').on('action.weatherAction', onWeatherAction)
  cacheIcons()
}

function cacheIcons () {
  lametric.cloud.getIcons().then(icons => {
    autocompleteIcons = icons.map(icon => ({
      image: icon.thumb.small,
      name: icon.title + ' (' + icon.id + ')',
      code: icon.code
    }))
  }).catch(reason => {
    util.errorLog('Something went wrong getting icons')
  })
}

function filterAutocomplete (list, value) {
  return list
    .filter((item) => item.name.toLowerCase().includes(value.toLowerCase()))
    .sort((a, b) => (a.name > b.name ? 1 : -1))
}

function onAlarmClockSet (callback, args) {
  util.debugLog('AlarmClockSet', args)
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    var params = {
      enabled: true,
      time: args.time,
      wake_with_radio: (args.radio === 'true')
    }
    // going for doAppAction here, widget id might be changed after lametric app reinstall
    lametric.device.doAppAction(settings.ipv4, args.device.apiKey, 'com.lametric.clock', 'clock.alarm', params).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onAlarmClockUnset (callback, args) {
  util.debugLog('AlarmClockUnset', args)
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    var params = {
      enabled: false
    }
    lametric.device.doAppAction(settings.ipv4, args.device.apiKey, 'com.lametric.clock', 'clock.alarm', params).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onAutoCompleteWidget (callback, args) {
  if (widgetsCache[args.args.device.mac] && new Date() - widgetsCache[args.args.device.mac].buildTime < 60000) {
    return callback(null, filterAutocomplete(widgetsCache[args.args.device.mac].list, args.query))
  }
  util.debugLog('building widgetCache...')
  Homey.manager('drivers').getDriver('lametric').getSettings(args.args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.device.getWidgets(settings.ipv4, args.args.device.apiKey).then(widgets => {
      widgetsCache[args.args.device.mac] = {
        list: widgets.map(widget => ({id: widget.widget, name: widget.title, app: widget.package})),
        buildTime: new Date()
      }
      return callback(null, filterAutocomplete(widgetsCache[args.args.device.mac].list, args.query))
    }).catch(error => {
      callback(error)
    })
  })
}

function onAutocompleteIcon (callback, args) {
  callback(null, filterAutocomplete(autocompleteIcons, args.query))
}

function onAutocompleteSound (callback, args) {
  callback(null, filterAutocomplete(sounds, args.query))
}

function onNotificationText (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.device.sendNotification(settings.ipv4, args.device.apiKey, args.icontype, args.text, null, null).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onNotificationTextIcon (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.device.sendNotification(settings.ipv4, args.device.apiKey, args.icontype, args.text, args.icon.code, null).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onNotificationTextIconSound (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.device.sendNotification(settings.ipv4, args.device.apiKey, args.icontype, args.text, args.icon.code, args.sound.id).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onNotificationTextSound (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.device.sendNotification(settings.ipv4, args.device.apiKey, args.icontype, args.text, null, args.sound.id).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onRadioAction (callback, args) {
  simpleAppAction(callback, args, 'com.lametric.radio')
}

function onSetVolume (callback, args) {
  Homey.manager('drivers').getDriver('lametric').capabilities.volume_set.set(args.device, args.volume / 100, callback)
}

function onShowWidget (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    // going for showApp here, widget id might be changed after lametric app reinstall
    lametric.device.showApp(settings.ipv4, args.device.apiKey, args.widget.app).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onShowWidgetNextPrev (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.device['showWidget' + args.direction](settings.ipv4, args.device.apiKey).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onStopwatchAction (callback, args) {
  simpleAppAction(callback, args, 'com.lametric.stopwatch')
}

function onTimerAction (callback, args) {
  simpleAppAction(callback, args, 'com.lametric.countdown')
}

function onTimerConfig (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    var params = {
      duration: args.duration,
      start_now: (args.start === 'true')
    }
    // going for doAppAction here, widget id might be changed after lametric app reinstall
    lametric.device.doAppAction(settings.ipv4, args.device.apiKey, 'com.lametric.countdown', 'countdown.configure', params).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onWeatherAction (callback, args) {
  simpleAppAction(callback, args, 'com.lametric.weather')
}

function simpleAppAction (callback, args, appId) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.device.doAppAction(settings.ipv4, args.device.apiKey, appId, args.action).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

const sounds = [
  {id: 'bicycle', name: 'Bicycle'},
  {id: 'car', name: 'Car'},
  {id: 'cash', name: 'Cash'},
  {id: 'cat', name: 'Cat'},
  {id: 'dog', name: 'Dog 1'},
  {id: 'dog2', name: 'Dog 2'},
  {id: 'energy', name: 'Energy'},
  {id: 'knock-knock', name: 'Knock Knock'},
  {id: 'letter_email', name: 'Letter Email'},
  {id: 'lose1', name: 'Lose 1'},
  {id: 'lose2', name: 'Lose 2'},
  {id: 'negative1', name: 'Negative 1'},
  {id: 'negative2', name: 'Negative 2'},
  {id: 'negative3', name: 'Negative 3'},
  {id: 'negative4', name: 'Negative 4'},
  {id: 'negative5', name: 'Negative 5'},
  {id: 'notification', name: 'Notification 1'},
  {id: 'notification2', name: 'Notification 2'},
  {id: 'notification3', name: 'Notification 3'},
  {id: 'notification4', name: 'Notification 4'},
  {id: 'open_door', name: 'Open Door'},
  {id: 'positive1', name: 'Positive 1'},
  {id: 'positive2', name: 'Positive 2'},
  {id: 'positive3', name: 'Positive 3'},
  {id: 'positive4', name: 'Positive 4'},
  {id: 'positive5', name: 'Positive 5'},
  {id: 'positive6', name: 'Positive 6'},
  {id: 'statistic', name: 'Statistic'},
  {id: 'thunder', name: 'Thunder'},
  {id: 'water1', name: 'Water 1'},
  {id: 'water2', name: 'Water 2'},
  {id: 'win', name: 'Win 1'},
  {id: 'win2', name: 'Win 2'},
  {id: 'wind', name: 'Wind long'},
  {id: 'wind_short', name: 'Wind short'}
]
