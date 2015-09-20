'use strict';

angular.module('MozMap', [])
.controller('MozMapController', function ($scope, $http, $filter) {

    var featureLayer,
        map,
        colors = {
            city: '#c13832',
            region: '#c3716d',
            country: '#c3a9a8'
        },
        filterWatchExpressions = [
            'filter.vouched',
            'filter.precision.city',
            'filter.precision.region',
            'filter.precision.country',
            'filter.precision.none'
        ];

    $scope.mozillians = [];
    $scope.activeUser = null;
    $scope.mapInteractionEnabled = true;

    $scope.settings = {
        irc: false
    };

    $scope.queries = [];
    $scope.filter = {
        vouched: true,
        country: {},
        group: {},
        precision: {
            city: true,
            region: true,
            country: true,
            none: true
        }
    };

    $scope.precisionFilter = function (user) {
        return (
            ($scope.filter.precision.city && user.city) ||
            ($scope.filter.precision.region && user.region && !user.city) ||
            ($scope.filter.precision.country && user.country && !user.region && !user.city) ||
            ($scope.filter.precision.none && !user.map_data)
        );
    };

    $scope.queryFilter = function (user) {
        var i, type, value;

        if ($scope.filter.vouched && !user.is_vouched) {
            return false;
        }

        for (i in $scope.queries) {
            type = $scope.queries[i].type;
            value = $scope.queries[i].value;

            if ($scope.filter[type][value] && ( // tests if filter is checked
                (type === 'country' && user.country === value) ||
                (type === 'group' && user.groups.indexOf(value) !== -1)
            )) {
                return true;
            }
        }

        return false;
    };

    $scope.openPopup = function (user) {
        if (user.marker) {
            user.marker.openPopup();
        } else if ($scope.activeUser && $scope.activeUser.marker) {
            $scope.activeUser.marker.closePopup();
        }
        $scope.activeUser = user;
    };

    $http.get('./webconf.json').then(function (res) {

        L.mapbox.accessToken = res.data.mapbox_access_token;

        map = L.mapbox.map('map', 'mapbox.streets', { zoomControl: false });

        new L.Control.Zoom({ position: 'topright' }).addTo(map);

        toggleMapInteraction();
        var InteractionToggleControl = L.Control.extend({
            options: { position: 'topright' },
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar map-interaction-toggle-control'),
                    a = document.createElement('a');

                a.setAttribute('href', '#');
                a.setAttribute('title', 'Karteninteraktion an/abschalten');
                a.setAttribute('class', 'map-interaction-toggle');
                a.innerHTML = '<i class="fa fa-lock"></i>';
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    toggleMapInteraction();
                    a.innerHTML = $scope.mapInteractionEnabled ? '<i class="fa fa-unlock-alt"></i>' : '<i class="fa fa-lock"></i>';
                    $scope.$apply();
                }, false);

                container.appendChild(a);

                return container;
            }
        });
        map.addControl(new InteractionToggleControl());

        $scope.queries = res.data.queries;
        angular.forEach($scope.queries, function (query) {
            $scope.filter[query.type][query.value] = query.default;
            filterWatchExpressions.push('filter.' + query.type + '["' + query.value + '"]');
        });

        $http.get('./mozillians.json').then(function (res) {

            $scope.mozillians = res.data;

            for (var i in $scope.mozillians) {
                createLocationDetails($scope.mozillians[i]);
            }

            featureLayer = new L.mapbox.featureLayer();
            featureLayer.addTo(map);

            $scope.$watch('settings.irc', updatePopups);
            $scope.$watchGroup(filterWatchExpressions, updateMarkers);
        });
    });

    function toggleMapInteraction() {
        $scope.mapInteractionEnabled = !$scope.mapInteractionEnabled;

        if ($scope.mapInteractionEnabled) {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
        } else {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            if (map.tap) map.tap.disable();
        }
    }

    function updatePopups() {
        angular.forEach($scope.mozillians, updatePopup);

        // check popup position if popup is opened
        if ($scope.activeUser && $scope.activeUser.marker) {
            $scope.activeUser.marker.getPopup().update();
        }
    }

    function updatePopup(user) {
        if (!user.popup) {
            user.popup = document.createElement('div');
            user.popup.setAttribute('class', 'popup_main');
        }

        user.popup.innerHTML =

            '<img src="' + (user.photo ? user.photo : 'images/mozillian.png') + '" alt="Picture" width="50" height="50">' +

            '<div class="text_info">' +
                // name
                '<b>' + (user.full_name || user.username) + '</b>' +

                // vouch status
                (user.is_vouched
                    ? '' // ' <i class="fa fa-check" title="Andere Mozillianer haben für dieses Profil gebürgt."></i>'
                    : ' <i class="fa fa-exclamation-circle" title="Für dieses Profil wurde noch nicht gebürgt."></i>') +

                '<br>' +

                // irc
                ($scope.settings.irc && user.ircname
                    ? ('<i class="fa fa-fw fa-comments" title="IRC"></i> ' + user.ircname + '<br>') : '') +

                // location
                (user.location ? ('<i class="fa fa-fw fa-map-marker"></i> ' + user.location + '<br>') : '') +

                // profile
                '<i class="fa fa-fw fa-globe"></i> <a href="' + user.url + '" target="_blank">Mozillianer-Profil</a>' +

            '</div>' +

            '<div style="clear:both"></div>';
    }

    function updateMarkers() {
        var filteredList = $filter('filter')($scope.mozillians, function (user) {
            return user.map_data && $scope.precisionFilter(user) && $scope.queryFilter(user);
        });

        // remove all markers that are not in the new selection
        featureLayer.eachLayer(function (marker) {
            for (var i in filteredList) {
                if (marker == filteredList[i].marker) {
                    // it still exits, do not remove it
                    return;
                }
            }

            // not returned yet, remove it
            featureLayer.removeLayer(marker);
        });

        // add missing markers
        angular.forEach(filteredList, addMarker);

        // auto-zoom layer
        if (featureLayer.getLayers().length > 0) {
            map.fitBounds(featureLayer.getBounds());
        }

        // reopen popup if necessary and
        if ($scope.activeUser) {
            $scope.openPopup($scope.activeUser);
        }
    }

    function addMarker(user) {
        if (!user.marker) {
            user.marker = L.marker([user.map_data.center[1], user.map_data.center[0]], {
                icon: L.mapbox.marker.icon({
                    'marker-color': colors[user.locationAccuracy]
                })
            })
            .bindPopup(user.popup)
            .on('click', function (e) {
                $scope.activeUser = user;
                $scope.$apply();
            });
        }

        user.marker.addTo(featureLayer);
    }

    function createLocationDetails(user) {
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

        user.location = location.join(', ');

        if (user.city) {
            user.locationAccuracy = 'city';
        } else if (user.region) {
            user.locationAccuracy = 'region';
        } else if (user.country) {
            user.locationAccuracy = 'country';
        }
    }

})

.directive('scrollIf', function () {
    var mozilliansContainer = document.getElementById('userlist-container');

    return function (scope, element, attrs) {
        scope.$watch(attrs.scrollIf, function (value) {
            if (scope.$eval(attrs.scrollIf)) {
                var el = element[0],
                    elPos = el.offsetTop,
                    mcPos = mozilliansContainer.scrollTop,
                    upperEnd = 20,
                    lowerEnd = mozilliansContainer.offsetHeight - el.offsetHeight - 20;

                if (elPos < mcPos + upperEnd) {
                    $(mozilliansContainer).animate({ scrollTop: el.offsetTop - upperEnd });
                } else if (elPos > mcPos + lowerEnd) {
                    $(mozilliansContainer).animate({ scrollTop: el.offsetTop - lowerEnd });
                }
            }
        });
    }
});
