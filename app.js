'use strict'
var FlowActions = require('./lib/flow/actions.js')

var self = module.exports = { // eslint-disable-line
  init: function () {
    console.log('Initialising LaMetric app...')
    FlowActions.init()
  } // end of module init function
}
