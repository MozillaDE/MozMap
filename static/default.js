'use strict';

angular.module('MozMap', [])
.controller('MozMapController', function ($scope, $http) {

	$scope.mozillians = [];
	$scope.activeUser = null;
	$scope.openPopup = function (user) {
		if (user.marker) {
			user.marker.openPopup();
		} else {
			$scope.activeUser.marker.closePopup();
		}
		$scope.activeUser = user;
	}
	
	$scope.settings = {
		irc: false
	};
	
	var featureLayer,
		map;
	
	$http.get('./webconf.json').then(function (res) {
		
		L.mapbox.accessToken = res.data.mapbox_access_token;
	

		map = L.mapbox.map('map', 'mapbox.streets');
		featureLayer = new L.mapbox.featureLayer(); // L.MarkerClusterGroup();


		$http.get('./mozillians.json').then(function (res) {
			var json = res.data;
			$scope.mozillians = json;

			for (var i = 0; i < json.length; i++) {
				var user = json[i];

				if (user.map_data) {
					addMarker(user);
				}
			}

			featureLayer.addTo(map);
			map.fitBounds(featureLayer.getBounds());
		});
	});

	function addMarker(user) {
		
		user.marker = L.marker([user.map_data.center[1], user.map_data.center[0]], {
				icon: L.mapbox.marker.icon({
				  'marker-color': '#C13832'
				})
			})
			.bindPopup(getPopUpHTML(user))
			.addTo(featureLayer)
			.on('click', function (e) {
				$scope.activeUser = user;
				$scope.$apply();
			});
		
	}

	function getPopUpHTML(user) {
		return (
			'<div class="popup_main">' +

				'<img src="' + user.photo + '" alt="Picture" width="50" height="50">' +

				'<div class="text_info">' +
					// name
					'<b>' + (user.full_name || user.username) + '</b>' +

					// vouch status
					(user.is_vouched
						? '' // ' <i class="fa fa-check" title="Andere Mozillians haben für dieses Profil gebürgt."></i>'
						: ' <i class="fa fa-exclamation-circle" title="Für dieses Profil wurde noch nicht gebürgt."></i>') +

					'<br>' +

					// irc TODO make this optional
					($scope.settings.irc && user.ircname
					    ? ('<i class="fa fa-fw fa-comments" title="IRC"></i> ' + user.ircname + '<br>') : '') +

					// location
					(user.location ? ('<i class="fa fa-fw fa-map-marker"></i> ' + user.location + '<br>') : '') +

					// profile
					'<i class="fa fa-fw fa-globe"></i> <a href="' + user.url + '" target="_blank">Mozillians-Profil</a>' +

				'</div>'+

			'</div>' +

			'<div style="clear:both"></div>');
	}

});



