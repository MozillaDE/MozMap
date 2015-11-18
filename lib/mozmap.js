'use strict';

let utils = require('./utils'),
    express = require('express'),
    http = require('http'),
    MozilliansData = require('./mozillians_data'),
    location_data = require('./location_data'),
    app = express(),

    PORT_HTTP   = utils.config.port_http,
    PORT_HTTPS  = utils.config.port_https,
    FORCE_HTTPS = utils.config.force_https,
    SSL_KEY     = utils.config.ssl_key,
    SSL_CERT    = utils.config.ssl_cert,
    LOCAL_UPDATES_ONLY = utils.config.local_updates_only,
    MIN_DELAY = utils.config.min_delay,
    MOZILLIANS_CACHE_PATH = './cache/mozillians.json',
    
    lastRun,
    mozillians;

utils.createFolder('./cache/');
mozillians = utils.readJsonFileSync(MOZILLIANS_CACHE_PATH);

// add middleware that redirects http to https, if enabled
if (PORT_HTTPS && FORCE_HTTPS) {
    app.use(function (req, res, next) {
        if (req.secure) {
            next();
        } else if(parseInt(PORT_HTTPS) !== 443) {
            res.redirect('https://' + req.hostname + ':' + PORT_HTTPS + req.originalUrl);
        } else {
            res.redirect('https://' + req.hostname + req.originalUrl);
        }
    });
}

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

// create server
http.createServer(app).listen(PORT_HTTP);
if (PORT_HTTPS && PORT_HTTPS > 0) {
    let https = require('https'),
        fs = require('fs');

    const options = {
        requestCert: false,
        rejectUnauthorized: true,
        key: fs.readFileSync(SSL_KEY),
        cert: fs.readFileSync(SSL_CERT)
    };

    https.createServer(options, app).listen(PORT_HTTPS);
}

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
