"use strict";
var http = require('http.min');
var self = module.exports = {
	calendars: [],
	init: function() {
		console.log("Initialising LaMetric app...");
		// Read calendars from settings.
		self.lametrics = Homey.manager("settings").get("lametrics") || [];
		console.log("Loaded " + self.lametrics.length + " lametrics(s) from settings.");
		// Listen for flow triggers.
		Homey.manager('flow').on('action.lametric_notification.sound.autocomplete', self.select_sound);
	    Homey.manager('flow').on('action.lametric_notification.nickname.autocomplete', self.select_nickname);
		Homey.manager('flow').on('action.lametric_notification', self.send_message);
	},
	// When this app has been triggered via a flow 
	select_nickname: function(callback, args, state) {
		var nickname = self.lametrics;
		callback(null, nickname.filter((item) => item.name.toLowerCase().includes(args.query.toLowerCase())).sort((a, b) => (a.name > b.name ? 1 : -1)));
	},
	// When this app has been triggered via a flow 
	select_sound: function(callback, args, state) {
		var sounds = [{
			id: 'bicycle',
			name: 'Bicycle'
		}, {
			id: 'car',
			name: 'Car'
		}, {
			id: 'cash',
			name: 'Cash'
		}, {
			id: 'cat',
			name: 'Cat'
		}, {
			id: 'dog',
			name: 'Dog 1'
		}, {
			id: 'dog2',
			name: 'Dog 2'
		}, {
			id: 'energy',
			name: 'Energy'
		}, {
			id: 'knock-knock',
			name: 'Knock Knock'
		}, {
			id: 'letter_email',
			name: 'Letter Email'
		}, {
			id: 'lose1',
			name: 'Lose 1'
		}, {
			id: 'lose2',
			name: 'Lose 2'
		}, {
			id: 'negative1',
			name: 'Negative 1'
		}, {
			id: 'negative2',
			name: 'Negative 2'
		}, {
			id: 'negative3',
			name: 'Negative 3'
		}, {
			id: 'negative4',
			name: 'Negative 4'
		}, {
			id: 'negative5',
			name: 'Negative 5'
		}, {
			id: 'notification',
			name: 'Notification 1'
		}, {
			id: 'notification2',
			name: 'Notification 2'
		}, {
			id: 'notification3',
			name: 'Notification 3'
		}, {
			id: 'notification4',
			name: 'Notification 4'
		}, {
			id: 'open_door',
			name: 'Open Door'
		}, {
			id: 'positive1',
			name: 'Positive 1'
		}, {
			id: 'positive2',
			name: 'Positive 2'
		}, {
			id: 'positive3',
			name: 'Positive 3'
		}, {
			id: 'positive4',
			name: 'Positive 4'
		}, {
			id: 'positive5',
			name: 'Positive 5'
		}, {
			id: 'positive6',
			name: 'Positive 6'
		}, {
			id: 'statistic',
			name: 'Statistic'
		}, {
			id: 'thunder',
			name: 'Thunder'
		}, {
			id: 'water1',
			name: 'Water 1'
		}, {
			id: 'water2',
			name: 'Water 2'
		}, {
			id: 'win',
			name: 'Win 1'
		}, {
			id: 'win2',
			name: 'Win 2'
		}, {
			id: 'wind',
			name: 'Wind long'
		}, {
			id: 'wind_short',
			name: 'Wind short'
		}];
		callback(null, sounds.filter((item) => item.name.toLowerCase().includes(args.query.toLowerCase())).sort((a, b) => (a.name > b.name ? 1 : -1)));
	},
	// when this app has been triggered via a flow              
	send_message: function(callback, args, state) {
		var notification_icon = 'i' + args.icon;
		console.log('Icon: ' + notification_icon);
		var notification_text = args.text;
		console.log('Text: ' + notification_text);
		var notification_sound = args.sound.id;
		console.log('Sound: ' + notification_sound);
		// var lametric_ip = Homey.manager('settings').get('lametric_ip_address')
		console.log('IP address: ' + args.nickname.ip);
		// var lametric_api = Homey.manager('settings').get('lametric_api_key')
		console.log('API key: ' + args.nickname.api);
		console.log('http://dev:' + args.nickname.api + '@' + args.nickname.ip + ':8080/api/v2/device/notifications');
		var options = {
			uri: 'http://dev:' + args.nickname.api + '@' + args.nickname.ip + ':8080/api/v2/device/notifications',
			json: {
				priority: 'warning',
				icon_type: 'info',
				model: {
					cycles: 3,
					frames: [{
						icon: notification_icon,
						text: notification_text
					}],
					sound: {
						category: 'notifications',
						id: args.sound.id,
						repeat: 1
					}
				}
			}
		}
		http.post(options).then(function(result) {
				if (result.response.statusCode !== 201) return callback('failure')
				callback(null, true)
			}).catch(callback) // will callback with error as first argument
	},
	updateSettings: function(settings, callback) {
        // Update settings.
        self.lametrics = settings.lametrics;
        // Show settings in console log
        console.log("Settings updated: " + JSON.stringify(settings));
        // Return success
        if (callback) callback(null, true);
    }
}