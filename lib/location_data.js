'use strict';

let utils = require('./utils'),
    getJson = utils.getJson,

	ACCESS_TOKEN = utils.config.mapbox_access_token,
	LOCATION_CACHE_PATH = './cache/locations.json',
	LOCATION_CACHE_CREATION_DATE = 'location_cache_creation_date',

	cache_creation_date,
    old_location_cache, 
	location_cache = {}; // eg. 'Erlangen, Bayern, Germany': { ... }

cache_creation_date = utils.getCacheInfo(LOCATION_CACHE_CREATION_DATE);
old_location_cache = utils.readJsonFileSync(LOCATION_CACHE_PATH);

function insertMapData(userLists) {
	
	return new Promise(function (resolve, reject) {
		try {
			prepareCache();
			processList(userLists.Public)
				.then(function () {
					processList(userLists.Mozillians)
						.then(function () {
							resolve(userLists);
						});
				});
		} catch (e) {
			reject(e);
		}
	});
	
}

function prepareCache() {
	
	if (!cache_creation_date || Date.now() > cache_creation_date + 10 * 24 * 3600 * 1000) { // 10 days
		
		// delete cache at least all 30 days (licence requirement from mapbox!)
		old_location_cache = {};
		location_cache = {};
		
		cache_creation_date = Date.now();
		utils.saveJsonFileSync(LOCATION_CACHE_PATH, {});
		utils.setCacheInfo(LOCATION_CACHE_CREATION_DATE, cache_creation_date);
		
	} else {
	
		// create a new cache so that old entries are deleted if they don't exist anymore
		old_location_cache = location_cache;
		location_cache = {};
		
	}

}

function processList(list) {
	
	return new Promise(function (resolve, reject) {
		try {
			processNextUser(list.length, list, resolve, reject);
		} catch (e) {
			reject(e);
		}
	});
	
}

function processNextUser(i, userList, resolve, reject) {

	let location;
	
	if (!i--) {

		// update cache file
		utils.saveJsonFileSync(LOCATION_CACHE_PATH, location_cache);

		// finished! =)
		resolve();
		
	} else {

		location = createLocationString(userList[i]);

		if (!location) {

			processNextUser(i, userList, resolve, reject);

		} else {

			if (location_cache[location] || old_location_cache[location]) {

				// try to get data from cache
				userList[i].map_data = location_cache[location] || old_location_cache[location];
				location_cache[location] = userList[i].map_data;
				processNextUser(i, userList, resolve, reject);

			} else {

				// fetch the data otherwise
				getJson('https://api.mapbox.com/v4/geocode/mapbox.places/' + encodeURI(location) + '.json?access_token=' + ACCESS_TOKEN)
					.then(function (map_data) {
						if (map_data && map_data.features && map_data.features.length) {
							userList[i].map_data = map_data.features[0];
							location_cache[location] = map_data.features[0];
						}
						processNextUser(i, userList, resolve, reject);
					})
					.catch(reject);

			}
		}	
	}
}

function createLocationString(user) {
	let location = [];

	if (user.city) {
		location.push(user.city);
	}
	if (user.region) {
		location.push(user.region);
	}
	if (user.country) {
		location.push(user.country);
	}

	return location.join(', ');
}

module.exports = {
	insertMapData: insertMapData
};
