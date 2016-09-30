'use strict';

let Utils = require('./utils'),
    co = require('co'),

    cache_creation_date,
    old_location_cache,
    location_cache = {}; // eg. 'Erlangen, Bayern, Germany': { ... }

const ACCESS_TOKEN = Utils.config.mapbox_access_token,
      LOCATION_CACHE_PATH = './cache/locations.json',
      LOCATION_CACHE_CREATION_DATE = 'location_cache_creation_date';

cache_creation_date = Utils.getCacheInfo(LOCATION_CACHE_CREATION_DATE);
old_location_cache = Utils.readJsonFileSync(LOCATION_CACHE_PATH);

class LocationsProcessor {

    static insertMapData(userLists) {

        return new Promise((resolve, reject) => {
            try {
                LocationsProcessor._prepareCache();
            } catch (e) {
                reject(e);
            }

            LocationsProcessor._processList(userLists.Public)
                .then(() => LocationsProcessor._processList(userLists.Mozillians))
                .then(() => resolve(userLists))
                .catch(reject);
        });

    }

    static _prepareCache() {

        if (!cache_creation_date || Date.now() > cache_creation_date + 10 * 24 * 3600 * 1000) { // 10 days

            // delete cache at least all 30 days (licence requirement from mapbox!)
            old_location_cache = {};
            location_cache = {};

            cache_creation_date = Date.now();
            Utils.saveJsonFileSync(LOCATION_CACHE_PATH, {});
            Utils.setCacheInfo(LOCATION_CACHE_CREATION_DATE, cache_creation_date);

        } else {

            // create a new cache so that old entries are deleted if they don't exist anymore
            old_location_cache = location_cache;
            location_cache = {};

        }

    }

    static _processList() {
        return co(function*(list) {
            for (let user of list) {
                let location = LocationsProcessor._createLocationString(user);
                if (location) {
                    if (location_cache[location] || old_location_cache[location]) {
                        // try to get data from cache
                        user.map_data = location_cache[location] || old_location_cache[location];
                        location_cache[location] = user.map_data;
                    } else {
                        // fetch the data otherwise
                        let map_data = yield Utils.getJson('https://api.mapbox.com/v4/geocode/mapbox.places/' + encodeURI(location) + '.json?access_token=' + ACCESS_TOKEN);

                        if (map_data && map_data.features && map_data.features.length) {
                            user.map_data = map_data.features[0];
                            location_cache[location] = map_data.features[0];
                        }
                    }
                }
            }

            Utils.saveJsonFileSync(LOCATION_CACHE_PATH, location_cache);
            return list;
        });
    }

    static _createLocationString(user) {
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

}

module.exports = LocationsProcessor.insertMapData;
