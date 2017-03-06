﻿(function () {
    'use strict';
    angular
        .module('spotifyLoggedInApp', [])
        .controller('LoggedInCtrl', LoggedIn)

    LoggedIn.$inject = ['$http', '$sce', '$location'];

    function LoggedIn($http, $sce, $location) {
        var vm = this;

        //var params = $location.search(); //doesn't seem to work, parse params manually
        var url = $location.$$absUrl;
        var params = url.split('?code=')[1].split('&state=');
        var code = params[0];
        //var user = params[1]; //not needed 

        var playlist = sessionStorage.playlist; //get playlist from original window using sessionStorage
        $http.post('/recap/savePlaylist/' + code, playlist).then(function (response) {
            vm.playlistUrl = $sce.trustAsResourceUrl(response.data);
        }).catch(function (err) {
            vm.error = true;
        });


    }; //end controller

})(); //end closure