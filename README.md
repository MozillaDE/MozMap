# MozMap
A map with Mozillians from the German-speaking Mozillia community. 

To be able to start the server you have to create a `config.json` file.
	{
		"mozillians_api_key": "-your-key-here-",
		"mapbox_access_token": "-your-token-here-",
		"local_updates_only": true,
		"min_delay": 3600000
	}

Start the server with
	$ node index.js
