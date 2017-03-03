(function () {
    'use strict';
    var app = angular.module('instagramLoggedInApp', []);

    app.controller('InstagramLoggedInCtrl', ['$scope', '$window', function ($scope, $window) {
        $window.onload = function () {
            $window.close();
        }
    }]); //end controller

})(); //end closure