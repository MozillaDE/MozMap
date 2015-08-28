'use strict';

var utils = require('./utils'),
	Q = require('q'),
    getJson = utils.getJson,
	
	API_KEY = utils.config.mozillians_api_key;

function MozilliansData() {

	this.mozillians = {
		Public: [],
		Mozillians: []
	};

	this.keys = [];

	this.queries = utils.config.queries;
	this.queryIndex = 0;
	this.query = this.queries[this.queryIndex];
	
	this.currentList;
	this.currentListIndex;
	this.currentUser;

	// TODO use all queries
	return this.addDataSource();

}

MozilliansData.prototype.addDataSource = function () {
	var url = 'https://mozillians.org/api/v2/users/?api-key=' + API_KEY + '&' + this.query.type + '=' + this.query.value;

	return getJson(url)
		.then(this.saveUsers.bind(this));
};

MozilliansData.prototype.saveUsers = function (queryResponse) {

	this.currentList = queryResponse.results;
	this.currentListIndex = queryResponse.results.length;
	
	return Q.Promise(this.saveNextUser.bind(this));

};

MozilliansData.prototype.saveNextUser = function (resolve, reject) {

	if (!this.currentListIndex) {

		// finished
		resolve(this.mozillians);

	} else {

		var userUrl = this.currentList[--this.currentListIndex]._url,
		    index = this.keys.indexOf(userUrl);

		// check if the user is already in the list
		if (index !== -1) {

			this.addGroupFromQuery(index);
			this.saveNextUser(resolve, reject);

		} else {

			getJson(userUrl + '?api-key=' + API_KEY)
				.then(function (user) {

					if (user.is_public) {
						this.currentUser = user;
						this.addUser();
						this.addGroupFromQuery(this.keys.length);
						this.keys.push(userUrl);
					}

					this.saveNextUser(resolve, reject);

				}.bind(this))
				.fail(reject);
		}
	}
};

MozilliansData.prototype.addUser = function () {

	var url = fixProfileUrl(this.currentUser.url);

	// Datenschutz: Nur speichern, was benötigt wird :)
	// & Daten vorbereiten
	this.insertData(this.mozillians.Public, [ 'Public' ], url);
	this.insertData(this.mozillians.Mozillians, [ 'Public', 'Mozillians' ], url);

};

MozilliansData.prototype.insertData = function (list, privacyLevels, url) {
	var user = this.currentUser;

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
		groups: [],
		map_data: null
	});
};

MozilliansData.prototype.addGroupFromQuery = function (index) {
	// if it's a group query, add the group name
	// as we are not able to get the group names via API
	if (this.query.type === 'group') {
		this.mozillians.Mozillians[index].groups.push(this.query.value);
		this.mozillians.Public[index].groups.push(this.query.value);
	}
};

//// helper functions ////

function isDataAvailable(privacyLevels, property) {
	return privacyLevels.indexOf(property.privacy) !== -1 && property.value;
};

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
};

module.exports = MozilliansData;
