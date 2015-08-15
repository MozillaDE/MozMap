'use strict';

var blub = [],
	featureLayer,
	map;

$.getJSON('./webconf.json', function (json) {

	L.mapbox.accessToken = json.mapbox_access_token;


	map = L.mapbox.map('map', 'mapbox.streets');
	featureLayer = new L.mapbox.featureLayer(); // L.MarkerClusterGroup();

	$.getJSON('./mozillians.json', function (json) {

		for (var i = 0; i < json.length; i++) {

			var user = json[i],
				data = user.map_data;

			if (data) {

				showMap(null, data, user);

			} else {
				console.info(user.username, 'hat keinen Standort angegeben');
			}

		}

		featureLayer.addTo(map);
		map.fitBounds(featureLayer.getBounds());

	});
});

function showMap(err, data, user) {

	var marker = L.marker([data.center[1], data.center[0]], {
			icon: L.mapbox.marker.icon({
			  'marker-color': '#C13832'
			})
		})
		.bindPopup(getPopUpHTML(user))
		.addTo(featureLayer);
		//.openPopup();
}

function getPopUpHTML(user) {
	return (
		'<div class="popup_main">' +

			'<img src="' + user.photo + '" alt="Gravatar" width="50" height="50">' +

			'<div class="text_info">' +
				// name
				'<b>' + (user.full_name || user.username) + '</b>' +

				// vouch status
				(user.is_vouched // TODO
					? '' // ' <i class="fa fa-check" title="Andere Mozillians haben für dieses Profil gebürgt."></i>'
					: ' <i class="fa fa-exclamation-circle" title="Für dieses Profil wurde noch nicht gebürgt."></i>') +

				'<br>' +

				// irc TODO make this optional
				// (user.ircname ? ('<i class="fa fa-fw fa-comments" title="IRC"></i> ' + user.ircname + '<br>') : '') +

				// location
				(user.location ? ('<i class="fa fa-fw fa-map-marker"></i> ' + user.location + '<br>') : '') +

				// profile
				'<i class="fa fa-fw fa-globe"></i> <a href="' + user.url + '" target="_blank">Mozillians-Profil</a>' +

			'</div>'+

		'</div>' +

		'<div style="clear:both"></div>');
}
