'use strict';

let https = require('https'),
	http = require('http'),
	fs = require('fs'),

	CACHE_INFO_PATH = './cache/info.json',
	CONFIG_PATH = './config.json';

function getJson(url) {
	return new Promise(function (resolve, reject) {

		(url.substr(0, 8) === 'https://' ? https : http).get(url, function (res) {
			
			let data = '';

			res.on('data', function(d) {
				data += d;
			});

			res.on('end', function() {
				try {
					resolve(JSON.parse(data));
				} catch (e) {
					reject(e);
				}
			});

		}).on('error', function(e) {
			reject(e);
		});

	});
}

function readJsonFileSync(filename, reportFileNotFound) {
	try {
		const data = fs.readFileSync(filename, { encoding: 'utf8' });
		return JSON.parse(data);
	} catch (e) {
		if (reportFileNotFound || e.code !== 'ENOENT') {
			console.error(e);
		}
		return {};
	}
}

function saveJsonFileSync(filename, json) {
	try {
		const data = JSON.stringify(json);
		fs.writeFileSync(filename, data, { encoding: 'utf8' });
		return true;
	} catch (e) {
		console.error(e);
		return false;
	}
}

function getCacheInfo(key) {
	const json = readJsonFileSync(CACHE_INFO_PATH);
	return json && json[key] || null;
}

function setCacheInfo(key, val) {
	let json = readJsonFileSync(CACHE_INFO_PATH);
	json[key] = val;
	return saveJsonFileSync(CACHE_INFO_PATH, json);
}

function createFolder(path) {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path, '0755');
	}
}

module.exports = {
	config: readJsonFileSync(CONFIG_PATH, true),
	getJson: getJson,
	getCacheInfo: getCacheInfo,
	setCacheInfo: setCacheInfo,
	readJsonFileSync: readJsonFileSync,
	saveJsonFileSync: saveJsonFileSync,
	createFolder: createFolder
};
