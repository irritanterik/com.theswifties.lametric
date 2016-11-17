/* global Homey */
var lametric = require('../lametric.js')
var autocompleteIcons

exports.init = function () {
  Homey.manager('flow').on('action.notificationText', onNotificationText)
  Homey.manager('flow').on('action.notificationTextIcon', onNotificationTextIcon)
  Homey.manager('flow').on('action.notificationTextIcon.icon.autocomplete', onAutocompleteIcon)
  Homey.manager('flow').on('action.notificationTextIconSound', onNotificationTextIconSound)
  Homey.manager('flow').on('action.notificationTextIconSound.icon.autocomplete', onAutocompleteIcon)
  Homey.manager('flow').on('action.notificationTextIconSound.sound.autocomplete', onAutocompleteSound)
  Homey.manager('flow').on('action.notificationTextSound', onNotificationTextSound)
  Homey.manager('flow').on('action.notificationTextSound.sound.autocomplete', onAutocompleteSound)
  Homey.manager('flow').on('action.setVolume', onSetVolume)
  cacheIcons()
}

function cacheIcons () {
  lametric.getIcons().then(icons => {
    autocompleteIcons = icons.map(icon => ({
      image: icon.thumb.small,
      name: icon.title + ' (' + icon.id + ')',
      code: icon.code
    }))
  }).catch(reason => {
    console.log('Something went wrong getting icons')
  })
}

function onAutocompleteIcon (callback, args) {
  callback(null, autocompleteIcons
    .filter((item) => item.name.toLowerCase().includes(args.query.toLowerCase()))
    .sort((a, b) => (a.name > b.name ? 1 : -1)))
}

function onAutocompleteSound (callback, args) {
  callback(null, sounds
    .filter((item) => item.name.toLowerCase().includes(args.query.toLowerCase()))
    .sort((a, b) => (a.name > b.name ? 1 : -1)))
}

function onNotificationText (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.sendNotification(settings.ipv4, args.device.apiKey, args.text, null, null).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onNotificationTextIcon (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.sendNotification(settings.ipv4, args.device.apiKey, args.text, args.icon.code, null).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onNotificationTextIconSound (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.sendNotification(settings.ipv4, args.device.apiKey, args.text, args.icon.code, args.sound.id).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onNotificationTextSound (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.sendNotification(settings.ipv4, args.device.apiKey, args.text, null, args.sound.id).then(result => {
      callback(null, true)
    }).catch(callback)
  })
}

function onSetVolume (callback, args) {
  Homey.manager('drivers').getDriver('lametric').getSettings(args.device, (error, settings) => {
    if (error) return callback(error)
    lametric.setVolume(settings.ipv4, args.device.apiKey, args.volume).then(result => {
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
