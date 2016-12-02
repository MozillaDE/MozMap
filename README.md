# MozMap
A map with Mozillians from the German-speaking Mozillia community. 

## Setup

### Getting a Mozillians API key
Login to mozillians.org and go to [the API keys](https://mozillians.org/en-US/apikeys/) and get your key.

### Getting a mapbox token
You can find all the relevant information on [mapbox](https://www.mapbox.com/help/create-api-access-token/) itself.

### Create the config file
To be able to start the server you have to create a `data/config/config.json` file. Please make sure to add your keys in the file. Even though the config.json file is under gitignore, check before committing that you are not leaking your keys!

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

### Install Node
First you have to install [NodeJS](https://nodejs.org/). Please make sure to install version 4.0 or later.

### Install the dependencies

```bash
$ npm install
```

### Starting the server

Start the server with
```bash
$ node index.js
```

### View the Map
Now you can go to `localhost:3000` and view the magic.

## Contributing
Test it, hack it, create Pull Requests.
