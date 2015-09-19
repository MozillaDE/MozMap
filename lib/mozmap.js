'use strict';

let utils = require('./utils'),
    express = require('express'),
    MozilliansData = require('./mozillians_data'),
    location_data = require('./location_data'),
    app = express(),
    server,

    SERVER_PORT = utils.config.server_port,
    LOCAL_UPDATES_ONLY = utils.config.local_updates_only,
    MIN_DELAY = utils.config.min_delay,
    MOZILLIANS_CACHE_PATH = './cache/mozillians.json',
    
    lastRun,
    mozillians;

utils.createFolder('./cache/');
mozillians = utils.readJsonFileSync(MOZILLIANS_CACHE_PATH);

app.get('/update-cache', function (req, res) {

    if (LOCAL_UPDATES_ONLY && req.ip !== '127.0.0.1' && req.ip !== '::ffff:127.0.0.1' && req.ip !== '::1') {

        res.json({ success: false, error: `You are not allowed to update the cache. (IP: ${req.ip})` });

    } else if (lastRun && lastRun + MIN_DELAY > Date.now()) {
        
        res.json({ success: false, error: 'Please wait at least ' + MIN_DELAY + ' ms between two cache updates.' });
        
    } else {
    
        updateCache();
        res.json({ success: true });
        
    }

});

app.get('/webconf.json', function (req, res) {
    res.json({
        mapbox_access_token: utils.config.mapbox_access_token,
        queries: utils.config.queries
    });
});

// TODO serve mozillians.Mozillians data some day...
app.get('/mozillians.json', function (req, res) {
    res.json(mozillians.Public || []);
});

app.use(express.static('static'));

// TODO enable https
server = app.listen(SERVER_PORT, function () {
    const host = server.address().address,
          port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});

function updateCache() {
    lastRun = Date.now();

    console.info('Update started...');
    
    (new MozilliansData())
        .then(location_data.insertMapData)
        .then(function (json) {

            mozillians = json;
            utils.saveJsonFileSync(MOZILLIANS_CACHE_PATH, json);

            console.info('Update finsished =)');

        })
        .catch(console.error);
}

updateCache();
