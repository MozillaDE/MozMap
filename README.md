# MozMap
A map with Mozillians from the German-speaking Mozilla community. 

## Configuration

To be able to start the server you have to create a `data/config/config.json` file. Please make sure to add both, a valid Mozillians API key and a mapbox token. Quick reminder if you're contributing to this repo: make sure you're not leaking your keys! :)

**Mozillians API key**

Log in to mozillians.org and open the [manage API keys](https://mozillians.org/apikeys/) page. Create a new API key for API version 2.

**mapbox token**

You can find all the relevant information on [mapbox](https://www.mapbox.com/help/create-api-access-token/) itself.


```json
{
    "mozillians_api_key": "-your-key-here-",
    "mapbox_access_token": "-your-token-here-",
    "port_http": 3000,
    "port_https": 0,
    "force_https": false,
    "ssl_key": "/path/to/privkey.pem",
    "ssl_cert": "/path/to/cert.pem",
    "local_updates_only": true,
    "min_delay": 3600000,
    "queries": [
        { "type": "group",   "value": "de:community", "default": true  },
        { "type": "country", "value": "Germany",      "default": true  },
        { "type": "country", "value": "Austria",      "default": true  },
        { "type": "country", "value": "Switzerland",  "default": true  },
        { "type": "group",   "value": "german",       "default": false },
        { "type": "group",   "value": "austrian",     "default": false },
        { "type": "group",   "value": "switzerland",  "default": false },
        { "type": "group",   "value": "speaks:de",    "default": false }
    ]
}
```

Enable https by setting a `port_https` not equal to `0`. You can enable a redirect from http to https by setting `force_https` to `true`.

## Start Server without Docker

Make sure you have [NodeJS installed](https://nodejs.org/en/download/) on your machine. The server requires NodeJS version 4 or later.

```bash
# install dependencies
npm install

# start server
node server.js
```

Now you can go to `localhost:3000` and view the magic.

## Start Server with Docker

You have to [install Docker](https://www.docker.com/products/docker) to run the following commands.

```bash
# build image
docker build -t mozilla-de/mozmap .

# run image
docker run -p 3000:3000 -v "$(pwd)/data:/usr/src/app/data" mozilla-de/mozmap
```

After some seconds you should be able to open the map in your browser at `localhost:3000`.

## Contributing
Test it, hack it, create Pull Requests.
