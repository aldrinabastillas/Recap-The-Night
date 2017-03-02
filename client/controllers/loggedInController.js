(function () {
    'use strict';
    var app = angular.module('loggedInApp', []);

    app.controller('LoggedInController', ['$scope', '$http', '$window', '$sce', function ($scope, $http, $window, $sce) {
        $scope.onload = function () {
            var playlist = sessionStorage.user;
            $http.post('/recap/savePlaylist', playlist).then(function (response) {
                $scope.playlistUrl = $sce.trustAsResourceUrl(response.data);
            }).catch(function (err) {
                $scope.error = err;
            });
        } ();
    }]); //end controller

})(); //end closure