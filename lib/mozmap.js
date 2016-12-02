'use strict';

let Utils = require('./utils'),
    express = require('express'),
    http = require('http'),
    MozilliansProcessor = require('./mozillians-processor'),
    app = express(),

    PORT_HTTP   = Utils.config.port_http,
    PORT_HTTPS  = Utils.config.port_https,
    FORCE_HTTPS = Utils.config.force_https,
    SSL_KEY     = Utils.config.ssl_key,
    SSL_CERT    = Utils.config.ssl_cert,
    LOCAL_UPDATES_ONLY = Utils.config.local_updates_only,
    MIN_DELAY = Utils.config.min_delay;

Utils.createFolder('./data/cache/');
Utils.createFolder('./data/generated/');

// middleware that redirects http to https, if enabled
if (PORT_HTTPS && FORCE_HTTPS) {
    const defaultHttpsPort = parseInt(PORT_HTTPS) === 443;
    app.use((req, res, next) => {
        if (req.secure) {
            next();
        } else if(defaultHttpsPort) {
            res.redirect('https://' + req.hostname + req.originalUrl);
        } else {
            res.redirect('https://' + req.hostname + ':' + PORT_HTTPS + req.originalUrl);
        }
    });
}

app.get('/update-cache', (req, res) => {

    if (LOCAL_UPDATES_ONLY && req.ip !== '127.0.0.1' && req.ip !== '::ffff:127.0.0.1' && req.ip !== '::1') {

        res.json({ success: false, error: `You are not allowed to update the cache. (IP: ${req.ip})` });

    } else if (MozilliansProcessor.lastRun && MozilliansProcessor.lastRun + MIN_DELAY > Date.now()) {

        res.json({ success: false, error: `Please wait at least ${MIN_DELAY} ms between two cache updates.` });

    } else {

        new MozilliansProcessor().update();
        res.json({ success: true });

    }

});

app.get('/webconf.json', (req, res) => {
    res.json({
        mapbox_access_token: Utils.config.mapbox_access_token,
        queries: Utils.config.queries
    });
});

app.use('/generated', express.static('data/generated'));

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

new MozilliansProcessor().update();
