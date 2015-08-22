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
	// use utils.config.queries and create a user cache + add groups to the user
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
		.then(function (user) {
			if (user.is_public) {
				addUser(user);
			}

			if (i) {
				saveNextUser(i, userList, resolve, reject);
			} else {
				resolve(mozillians);
			}
		})
		.fail(reject);

}

function addUser(user) {

	var url = fixProfileUrl(user.url);

	// Datenschutz: Nur speichern, was benötigt wird :)
	// & Daten vorbereiten
	insertData(mozillians.Public, [ 'Public' ], user, url);
	insertData(mozillians.Mozillians, [ 'Public', 'Mozillians' ], user, url);

}

function insertData(list, privacyLevels, user, url) {
	list.push({
		username: user.username,
		full_name: isDataAvailable(privacyLevels, user.full_name) ? user.full_name.value : null,
		photo: isDataAvailable(privacyLevels, user.photo) ? user.photo['150x150'] : null,
		ircname: isDataAvailable(privacyLevels, user.ircname) ? user.ircname.value : null,
		is_vouched: user.is_vouched,
		url: url,
		city: isDataAvailable(privacyLevels, user.city) ? user.city.value : null,
		region: isDataAvailable(privacyLevels, user.region) ? user.region.value : null,
		country: isDataAvailable(privacyLevels, user.country) ? user.country.value : null,
		groups: [], // TODO fill this with data
		map_data: null
	});
}

//// helper functions ////

function isDataAvailable(privacyLevels, property) {
	return privacyLevels.indexOf(property.privacy) !== -1 && property.value;
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
