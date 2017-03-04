(function () {
    'use strict';

    angular
        .module('recapApp')
        .controller('SearchController', SearchController);

    SearchController.$inject = ['$http', '$window', 'setlistService'];

    function SearchController($http, $window, setlistService) {
        var vm = this; //ViewModel

        //functions
        vm.getSetlists = getSetlists;
        vm.getSetlistSongs = getSetlistSongs;
        vm.playPreview = playPreview;
        vm.spotifyLogin = spotifyLogin;

        //properties
        vm.error = null;
        vm.playlist = null;
        vm.setlists = null;
        vm.selectedArtist = '';


        /**
         * Step 2: Given an artist, display setlists
         * Called by link function in recap-directives.js
         * @param {string} artist
         */
        function getSetlists(artist) {
            setlistService.getSetlists(artist)
                .then(function (response) {
                    //jQuery for steps
                    $('#stepOne').removeClass('active');
                    $('#stepTwo').addClass('active').removeClass('disabled');
                    if (artist != vm.selectedArtist) { //new artist chosen, disable step three
                        $('#stepThree').addClass('disabled');
                    }

                    vm.selectedArtist = artist;
                    vm.playlist = null; //clear out in case different artist was searched
                    vm.setlists = response;
                    return response;
                })
                .catch(function (e) {
                    vm.error = true; //TODO
                });
        }; //end getSetlists


        /**
         * Step 3: Given a setlist, get the songs info from Spotify
         * @param setlist
         */
        function getSetlistSongs(setlist) {
            var sets = {
                sets: JSON.stringify(setlist.sets),
                artist: vm.selectedArtist,
                title: vm.selectedArtist + ' @ ' + setlist.venue,
            };

            setlistService.postSetlistSongs(sets)
                .then(function (response) {
                    vm.playlist = response;
                    $('#stepTwo').removeClass('active');
                    $('#stepThree').addClass('active').removeClass('disabled');
                    return response;
                })
                .catch(function (err) {
                    vm.error = true; //TODO
                });
        }; //end getSetlistSongs


        /**
         * Plays a preview of a song
         * @param {string} songId
         */
        function playPreview(songId) {
            var preview = $('#' + songId).get(0);
            if (preview.paused) {
                preview.play();
            } else {
                preview.pause();
            }
        }; //end playPreview


        /**
         * Opens a new window to do Spotify authentication
         */
        function spotifyLogin() {
            sessionStorage.playlist = JSON.stringify(vm.playlist); //save to sessionStorage
            $window.open('/recap/templates/spotifyLogin.html',
                'Login to Spotify', 'width=700,height=500,left=100,top=100');
        };

    }; //end SearchController


})(); //end closure