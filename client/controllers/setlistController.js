(function () {
    'use strict';
    var app = angular.module('setlistApp', []);

    app.controller('SetlistController', ['$rootScope', '$scope', '$http', '$window', '$sce',
        function ($rootScope, $scope, $http, $window, $sce) {

            /**
             *Given an artist, display setlists
             * Called by link function in recap-directives.js
             * @param {string} artist
             */
            $scope.getSetlists = function (artist) {
                $http.get('/recap/getSetlists/' + artist).then(function (response) {
                    var setlistArr = [];
                    $.each(response.data, function (index, item) {
                        setlistArr.push({
                            date: parseDate(item['@eventDate']),
                            venue: item['venue']['@name'] + ', ' + item['venue']['city']['@name'],
                            id: item['@id'],
                            sets: item['sets']
                        });
                    });
                    $scope.selectedArtist = artist;
                    $scope.setlists = setlistArr;
                }).catch(function (e) {
                    $scope.error = true;
                });
            }; //end getSetlists


            /**
             * Given a setlist, get the songs info from Spotify
             * @param setlist
             */
            $scope.getSetlistSongs = function (setlist) {
                var sets = {
                    sets: JSON.stringify(setlist.sets),
                    artist: $scope.selectedArtist
                };

                $http.post('/recap/getSetlistSongs', sets).then(function (response) {
                    var title = $scope.selectedArtist + ' @ ' + setlist.venue;
                    $scope.playlist = {
                        title: title,
                        songs: response.data,
                    };
                }).catch(function (err) {
                    //TODO:
                    $scope.error = true;
                });
            }; //end getSetlistSongs


            /**
             * Plays a preview of a song
             * @param {string} songId
             */
            $scope.playPreview = function (songId) {
                var preview = $('#' + songId).get(0);
                if (preview.paused) {
                    preview.play();
                }
                else {
                    preview.pause();
                }
            }; //end playPreview


            /**
             * Opens a new window to do authentication
             */
            $scope.loginPopup = function () {
                sessionStorage.user = JSON.stringify($scope.playlist);
                var popup = $window.open('/recap/templates/spotifyLogin.html',
                    'Login to Spotify', 'width=700,height=500,left=100,top=100');
            };

            /**
             * Sends list of songs to server, creates a Spotify
             * playlist, then returns its URL
             */
            $scope.savePlaylist = function () {
                var playlist = JSON.stringify($scope.playlist);
                $http.post('/recap/savePlaylist', playlist).then(function (response) {
                    $scope.playlistUrl = $sce.trustAsResourceUrl(response.data);
                }).catch(function (err) {
                    console.log(err);
                });
            };

        }]); //end controller

    /* Private Methods */
    /**
     * Parse dates from Setlist.fm into JS format
     * @param dateString
     */
    function parseDate(dateString) {
        var split = dateString.split('-'); //dates from setlist.fm are 'DD-MM-YYY'
        //which is incompatible with JS and Angular

        return new Date(split[2], split[1] - 1, split[0]); //year, month (0-11), date
    }; //end parseDate


})(); //end closure