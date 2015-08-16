'use strict';

angular.module('MozMap', [])
.controller('MozMapController', function ($scope, $http) {

	var featureLayer,
		map;

	$scope.mozillians = [];
	$scope.activeUser = null;

	$scope.settings = {
		irc: false
	};

	$scope.filter = {
		city: true,
		region: true,
		country: true,
		none: true
	};

	$scope.mozFilter = function (user) {
		return (
			($scope.filter.city && user.city) ||
			($scope.filter.region && user.region && !user.city) ||
			($scope.filter.country && user.country && !user.region && !user.city) ||
			($scope.filter.none && !user.map_data)
		);
	}

	$scope.openPopup = function (user) {
		if (user.marker) {
			user.marker.openPopup();
		} else if ($scope.activeUser.marker) {
			$scope.activeUser.marker.closePopup();
		}
		$scope.activeUser = user;
	}
	
	$http.get('./webconf.json').then(function (res) {
		
		L.mapbox.accessToken = res.data.mapbox_access_token;

		map = L.mapbox.map('map', 'mapbox.streets');
		featureLayer = new L.mapbox.featureLayer(); // L.MarkerClusterGroup(); breaks openPopup()


		$http.get('./mozillians.json').then(function (res) {

			$scope.mozillians = res.data;

			for (var i = 0; i < $scope.mozillians.length; i++) {

				var user = $scope.mozillians[i];

				user.location = createLocationString(user);

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
						? '' // ' <i class="fa fa-check" title="Andere Mozillianer haben für dieses Profil gebürgt."></i>'
						: ' <i class="fa fa-exclamation-circle" title="Für dieses Profil wurde noch nicht gebürgt."></i>') +

					'<br>' +

					// irc TODO make this optional
					($scope.settings.irc && user.ircname
					    ? ('<i class="fa fa-fw fa-comments" title="IRC"></i> ' + user.ircname + '<br>') : '') +

					// location
					(user.location ? ('<i class="fa fa-fw fa-map-marker"></i> ' + user.location + '<br>') : '') +

					// profile
					'<i class="fa fa-fw fa-globe"></i> <a href="' + user.url + '" target="_blank">Mozillianer-Profil</a>' +

				'</div>'+

			'</div>' +

			'<div style="clear:both"></div>');
	}

	function createLocationString(user) {
		var location = [];

		if (user.city) {
			location.push(user.city);
		}
		if (user.region) {
			location.push(user.region);
		}
		if (user.country) {
			location.push(user.country);
		}

		return location.join(', ');
	}

})

.directive('scrollIf', function () {
	return function (scope, element, attrs) {
		scope.$watch(attrs.scrollIf, function(value) {
			if (scope.$eval(attrs.scrollIf)) {
				element[0].scrollIntoView({ behavior: 'smooth' });
			}
		});
	}
});
