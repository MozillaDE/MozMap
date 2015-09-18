'use strict';

let utils = require('./utils'),
    co = require('co'),
    getJson = utils.getJson;

const API_KEY = utils.config.mozillians_api_key;

class MozilliansData {

	constructor() {
		this.mozillians = {
			Public: [],
			Mozillians: []
		};

		this.keys = [];

		return this.addDataSources(utils.config.queries);
	}

	addDataSources(queries) {
	    // this executes one getJson after another to avoid getting the details
	    // of the same user multiple times.
		return co(function*() {
		    for(var query of queries) {
		        let resp = yield getAllPages(buildURLForQuery(query));
                yield this.saveUsers(resp, query.type == "group" ? query.value : null);
            };
            return this.mozillians;
        }.bind(this));
	}

	saveUsers(queryResponse, group) {
	    // This adds all the returned users "at once" (map still executes
	    // saveNextUser before going to the next user)
        return Promise.all(queryResponse.map((user) => {
            return this.saveNextUser(user, group)
        }));
	}

	saveNextUser(user, group) {
        const userUrl = user._url,
              index = this.keys.indexOf(userUrl);

		// check if the user is already in the list
		if (index !== -1) {
		    if(group)
			    this.addGroup(index, group);
		    return Promise.resolve(null);
		} else {
			return getJson(userUrl + '?api-key=' + API_KEY)
				.then((user) => {
					if (user.is_public) {
						this.addUser(user);
						if(group)
						    this.addGroup(this.keys.length, group);
						this.keys.push(userUrl);
					}
				});
		}
	}

	addUser(user) {
		const url = fixProfileUrl(user.url);

		// Datenschutz: Nur speichern, was benötigt wird :)
		// & Daten vorbereiten
		insertData(this.mozillians.Public, [ 'Public' ], url, user);
		insertData(this.mozillians.Mozillians, [ 'Public', 'Mozillians' ], url, user);
	}

	addGroup(index, group) {
		// if it's a group query, add the group name
		// as we are not able to get the group names via API and one user might
		// be in multiple groups
		this.mozillians.Mozillians[index].groups.push(group);
		this.mozillians.Public[index].groups.push(group);
	}

}

//// helper functions ////

function buildURLForQuery(query) {
    return 'https://mozillians.org/api/v2/users/?api-key=' + API_KEY + '&' + query.type + '=' + query.value;
}

let getAllPages = co.wrap(function*(url) {
    let result, ret = [];
    do {
        result = yield getJson(url);
        ret = ret.concat(result.results);
        if(result.next) {
            url = result.next;
        }
    } while(result.next);
    return ret;
});

function isDataAvailable(privacyLevels, property) {
	return privacyLevels.indexOf(property.privacy) !== -1 && property.value;
}

function fixProfileUrl(url) {
	// strip the language code if it exists, eg. en-US/
	// from https://mozillians.org/en-US/u/alex_ploner/
	let parts = url.split('/');
	if (parts[3] !== 'u') {
		parts.splice(3, 1);
		return parts.join('/');
	} else {
		return url;
	}
}

function insertData(list, privacyLevels, url, user) {
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
}

module.exports = MozilliansData;
