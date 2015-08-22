# MozMap
A map with Mozillians from the German-speaking Mozillia community. 

To be able to start the server you have to create a `config.json` file.
```json
{
	"mozillians_api_key": "-your-key-here-",
	"mapbox_access_token": "-your-token-here-",
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

Start the server with
```bash
$ node index.js
```
