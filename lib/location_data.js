'use strict';

let utils = require('./utils'),
    co = require('co'),
    getJson = utils.getJson,

    cache_creation_date,
    old_location_cache,
    location_cache = {}; // eg. 'Erlangen, Bayern, Germany': { ... }

const ACCESS_TOKEN = utils.config.mapbox_access_token,
      LOCATION_CACHE_PATH = './cache/locations.json',
      LOCATION_CACHE_CREATION_DATE = 'location_cache_creation_date';

cache_creation_date = utils.getCacheInfo(LOCATION_CACHE_CREATION_DATE);
old_location_cache = utils.readJsonFileSync(LOCATION_CACHE_PATH);

function insertMapData(userLists) {

    return new Promise(function (resolve, reject) {
        try {
            prepareCache();
        } catch (e) {
            reject(e);
        }

        processList(userLists.Public)
            .then(() => processList(userLists.Mozillians))
            .then(() => resolve(userLists)).catch(reject);
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

let processList = co.wrap(function*(list) {
    for (let user of list) {
        let location = createLocationString(user);
        if (location) {
            if (location_cache[location] || old_location_cache[location]) {
                // try to get data from cache
                user.map_data = location_cache[location] || old_location_cache[location];
                location_cache[location] = user.map_data;
            } else {
                // fetch the data otherwise
                let map_data = yield getJson('https://api.mapbox.com/v4/geocode/mapbox.places/' + encodeURI(location) + '.json?access_token=' + ACCESS_TOKEN);

                if (map_data && map_data.features && map_data.features.length) {
                    user.map_data = map_data.features[0];
                    location_cache[location] = map_data.features[0];
                }
            }
        }
    }

    utils.saveJsonFileSync(LOCATION_CACHE_PATH, location_cache);
    return list;
});

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
