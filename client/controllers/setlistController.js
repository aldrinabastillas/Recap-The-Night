(function () {
    'use strict';
    /**
     * Module
     */
    var app = angular.module('setlistApp', ['ngCookies']);

    /**
     * Controller 
     */
    app.controller('SetlistController', ['$cookies', '$scope', '$http', '$window', 
        function ($cookies, $scope, $http, $window) {
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
                    $scope.error = true; //TODO
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
                    $scope.error = true; //TODO
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
                } else {
                    preview.pause();
                }
            }; //end playPreview


            /**
             * Opens a new window to do Spotify authentication
             */
            $scope.spotifyLogin = function () {
                sessionStorage.playlist = JSON.stringify($scope.playlist); //save to sessionStorage
                var popup = $window.open('/recap/templates/spotifyLogin.html',
                    'Login to Spotify', 'width=700,height=500,left=100,top=100');
            };


            /**
             * Opens a new window to do Instagram authentication
             */
            $scope.instagramLogin = function () {
                var popup = $window.open('/recap/templates/instagramLogin.html',
                    'Login to Instagram', 'width=700,height=500,left=100,top=100');
            };

            /**
            *
            */
            $scope.instagramSearch = function(){
                $http.get('/recap/instagramSearch/' + $scope.selectedArtist).then(function () {

                }).catch(function (err) {
                });
            }


        }]); //end controller


    /** 
     * Private Functions
     */

    /**
     * Parse dates from Setlist.fm into JS format
     * @param dateString
     */
    function parseDate(dateString) {
        var split = dateString.split('-'); //dates from setlist.fm are 'DD-MM-YYY'
        return new Date(split[2], split[1] - 1, split[0]); //JS format: year, month (0-11), date
    }; //end parseDate


})(); //end closure