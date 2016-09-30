'use strict';

let Utils = require('./utils'),
    co = require('co');

const API_KEY = Utils.config.mozillians_api_key;

class MozilliansProcessor {

    constructor() {
        this.mozillians = {
            Public: [],
            Mozillians: []
        };

        this.keys = [];

        return this.addDataSources(Utils.config.queries);
    }

    addDataSources(queries) {
        // this executes one getJson after another to avoid getting the details
        // of the same user multiple times.
        return co(function*() {
            for (let query of queries) {
                let resp = yield MozilliansProcessor._getAllPages(MozilliansProcessor._buildURLForQuery(query));
                yield this.saveUsers(resp, query.type == 'group' ? query.value : null);
            }
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
            if (group) {
                this.addGroup(index, group);
            }
            return Promise.resolve(null);
        } else {
            return Utils.getJson(userUrl + '?api-key=' + API_KEY)
                .then(user => {
                    if (user.is_public) {
                        this.addUser(user);
                        if (group) {
                            this.addGroup(this.keys.length, group);
                        }
                        this.keys.push(userUrl);
                    }
                });
        }
    }

    addUser(user) {
        const url = MozilliansProcessor._fixProfileUrl(user.url);

        // Datenschutz: Nur speichern, was benötigt wird :)
        // & Daten vorbereiten
        MozilliansProcessor._insertData(this.mozillians.Public, ['Public'], url, user);
        MozilliansProcessor._insertData(this.mozillians.Mozillians, ['Public', 'Mozillians'], url, user);
    }

    addGroup(index, group) {
        // if it's a group query, add the group name
        // as we are not able to get the group names via API and one user might
        // be in multiple groups
        this.mozillians.Mozillians[index].groups.push(group);
        this.mozillians.Public[index].groups.push(group);
    }

    static _buildURLForQuery(query) {
        return 'https://mozillians.org/api/v2/users/?api-key=' + API_KEY + '&' + query.type + '=' + query.value;
    }

    static _getAllPages() {
        return co(function*(url) {
            let result, ret = [];
            do {
                result = yield Utils.getJson(url);
                ret = ret.concat(result.results);
                if (result.next) {
                    url = result.next;
                }
            } while (result.next);
            return ret;
        });
    }

    static _isDataAvailable(privacyLevels, property) {
        return privacyLevels.indexOf(property.privacy) !== -1 && property.value;
    }

    static _fixProfileUrl(url) {
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

    static _insertData(list, privacyLevels, url, user) {
        list.push({
            username: user.username,
            full_name: MozilliansProcessor._isDataAvailable(privacyLevels, user.full_name) ? user.full_name.value : null,
            photo: MozilliansProcessor._isDataAvailable(privacyLevels, user.photo) ? user.photo['150x150'] : null,
            ircname: MozilliansProcessor._isDataAvailable(privacyLevels, user.ircname) ? user.ircname.value : null,
            is_vouched: user.is_vouched,
            url: url,
            city: MozilliansProcessor._isDataAvailable(privacyLevels, user.city) ? user.city.value : null,
            region: MozilliansProcessor._isDataAvailable(privacyLevels, user.region) ? user.region.value : null,
            country: MozilliansProcessor._isDataAvailable(privacyLevels, user.country) ? user.country.value : null,
            groups: [],
            map_data: null
        });
    }

}

module.exports = MozilliansProcessor;
