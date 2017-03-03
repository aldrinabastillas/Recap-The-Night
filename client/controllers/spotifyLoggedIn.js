(function () {
    'use strict';
    var app = angular.module('spotifyLoggedInApp', []);

    app.controller('SpotifyLoggedInCtrl', ['$scope', '$http', '$sce', function ($scope, $http, $sce) {
        $scope.onload = function () {
            var playlist = sessionStorage.playlist; //get playlist from original window using sessionStorage
            $http.post('/recap/savePlaylist', playlist).then(function (response) {
                $scope.playlistUrl = $sce.trustAsResourceUrl(response.data);
            }).catch(function (err) {
                $scope.error = err;
            });
        } ();
    }]); //end controller

})(); //end closure