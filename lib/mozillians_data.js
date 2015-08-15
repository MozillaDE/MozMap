'use strict';

var utils = require('./utils'),
	Q = require('q'),
    getJson = utils.getJson,
	
	API_KEY = utils.config.mozillians_api_key,
	
	mozillians;

function getUserList() {
	
	mozillians = {
		Public: [],
		Mozillians: []
	};
	
	// TODO find the best url or use a combination
	return getJson('https://mozillians.org/api/v2/users/?api-key=' + API_KEY + '&group=de:community')
		.then(saveUsers);
	
}

function saveUsers(userList) {
	
	return Q.Promise(function (resolve, reject) {
		saveNextUser(userList.results.length, userList.results, resolve, reject);
	});
}

function saveNextUser(i, userList, resolve, reject) {
	
	getJson(userList[--i]._url + '?api-key=' + API_KEY)
		.then(function (userData) {
			addUser(userData);

			if (i) {
				saveNextUser(i, userList, resolve, reject);
			} else {
				resolve(mozillians);
			}
		})
		.fail(reject);

}

function addUser(user) {
	
	var privacyLevels,
		location,
		url = fixProfileUrl(user.url);
	
	// Datenschutz: Nur speichern, was benötigt wird :)
	// & Daten vorbereiten
	
	privacyLevels = [ 'Public' ];
	location = createLocationString(privacyLevels, user);
	
	mozillians.Public.push({
		username: user.username,
		full_name: (isDataAvailable(privacyLevels, user.full_name)) ? user.full_name.value : null,
		photo: (isDataAvailable(privacyLevels, user.photo)) ? user.photo['150x150'] : null,
		ircname: (isDataAvailable(privacyLevels, user.ircname)) ? user.ircname.value : null,
		is_public: user.is_public,
		is_vouched: user.is_vouched,
		url: url,
		location: location,
		map_data: null
	});
	
	privacyLevels = [ 'Public', 'Mozillians' ];
	location = createLocationString(privacyLevels, user);
	
	mozillians.Mozillians.push({
		username: user.username,
		full_name: (isDataAvailable(privacyLevels, user.full_name)) ? user.full_name.value : null,
		photo: (isDataAvailable(privacyLevels, user.photo)) ? user.photo['150x150'] : null,
		ircname: (isDataAvailable(privacyLevels, user.ircname)) ? user.ircname.value : null,
		is_public: user.is_public,
		is_vouched: user.is_vouched,
		url: url,
		location: location,
		map_data: null
	});
}

//// helper functions ////

function isDataAvailable(privacyLevels, property) {
	return privacyLevels.indexOf(property.privacy) !== -1 && property.value;
}

// TODO change this to make city, region and country seperately available
function createLocationString(privacyLevels, user) {
	var location = [];

	if (isDataAvailable(privacyLevels, user.city)) {
		location.push(user.city.value);
	}

	if (isDataAvailable(privacyLevels, user.region)) {
		location.push(user.region.value);
	}

	if (isDataAvailable(privacyLevels, user.country)) {
		location.push(user.country.value);
	}

	return location.join(', ');
}

function fixProfileUrl(url) {
	// strip the language code if it exists, eg. en-US/
	// from https://mozillians.org/en-US/u/alex_ploner/
	var parts = url.split('/');
	if (parts[3] !== 'u') {
		parts.splice(3, 1);
		return parts.join('/');
	} else {
		return url;
	}
}

module.exports = {
	getUserList: getUserList
};
