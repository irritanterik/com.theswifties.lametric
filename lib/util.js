/* global Homey */
exports.debugLog = function (message, data) {
  var logLine = {}
  if (message) logLine.message = message
  if (data) logLine.data = data
  Homey.manager('api').realtime('debug', logLine)
  Homey.error(this.epochToTimeFormatter(), 'debug', message, data || '')
}

exports.errorLog = function (message, data) {
  var logLine = {}
  if (message) logLine.message = message
  if (data) logLine.data = data
  Homey.manager('api').realtime('error', logLine)
  Homey.error(this.epochToTimeFormatter(), 'error', message, data || '')
}

exports.epochToTimeFormatter = function (epoch) {
  return (new Date(epoch || new Date().getTime())).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1')
}
