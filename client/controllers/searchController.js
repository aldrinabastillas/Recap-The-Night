(function () {
    'use strict';

    angular
        .module('recapApp')
        .controller('SearchController', SearchController);

    SearchController.$inject = ['$http', '$window', 'setlistService', 'sixpackService'];

    function SearchController($http, $window, setlistService, sixpackService) {
        var vm = this; //ViewModel

        //functions
        vm.artistSearch = artistSearch;
        vm.getSetlists = getSetlists;
        vm.getSetlistSongs = getSetlistSongs;
        vm.participate = participate;
        vm.playPreview = playPreview;
        vm.spotifyLogin = spotifyLogin;
        vm.venueSearch = venueSearch;

        //properties
        vm.error = null;
        vm.playlist = null;
        vm.setlists = null;
        vm.selectedArtist = '';
        vm.selectedVenueId= '';


        /**
         * Step 1: 
         */
        function artistSearch() {
            var options = {
                apiSettings: {
                    url: 'http://api.spotify.com/v1/search?q={query}&type=artist',
                    onResponse: function (spotifyResponse) {
                        var response = { results: [] };

                        //iterate through results from Spotify
                        $.each(spotifyResponse.artists.items, function (i, artist) {
                            response.results.push({
                                title: artist.name,
                                image: (artist.images.length == 3) ? artist.images[0].url : '',
                                id: artist.id
                            });
                        });

                        return response;
                    }
                },
                fields: { //map results from Spotify to Semantic-UI API
                    results: 'results',
                    title: 'title',
                    image: 'image'
                },
                minCharacters: 3,
                onSelect: function (result, response) {
                    vm.getArtistSetlists(result.title);
                }
            };
            return options;
        };


        /**
         * Step 2: Given an artist, display setlists
         * Called by link function in recap-directives.js
         * @param {string} artist
         */
        function getArtistSetlists(artist) {
            setlistService.getSetlists(artist)
                .then(function (response) {
                    //jQuery for steps
                    $('#stepOne').removeClass('active');
                    $('#stepTwo').addClass('active').removeClass('disabled');
                    if (artist != vm.selectedArtist) { //new artist chosen, disable step three
                        $('#stepThree').addClass('disabled');
                        vm.playlist = null; 
                    }

                    vm.selectedArtist = artist;
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
        * Step 2: Given a venue, display setlists
        * @param {string} venue
        */
        function getVenueSetlists(venueIdvenue) {
            setlistService.getVenueSetlists(venueId)
                .then(function (response) {
                    //jQuery for steps
                    $('#stepOne').removeClass('active');
                    $('#stepTwo').addClass('active').removeClass('disabled');
                    if (venue != vm.selectedVenueId) { //new venue chosen, disable step three
                        $('#stepThree').addClass('disabled');
                        vm.playlist = null; 
                    }

                    vm.selectedVenueId = venueId;
                    vm.setlists = response;
                    return response;
                })
                .catch(function (e) {
                    vm.error = true; //TODO
                });
        }; //end getSetlists


        /**
         * 
         */
        function participate() {
            return new Promise(function (resolve, reject) {
                sixpackService.participate()
                    .then(function (response) {
                        resolve(response);
                    });
            });
        };


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


        /**
         * 
         */
        function venueSearch() {
            var options = {
                apiSettings: {
                    url: '/recap/getVenues/{query}',
                    onResponse: function (venueResponse) {
                        var response = { results: [] };

                        $.each(venueResponse, function (i, venue) {
                            response.results.push(venue);
                        });

                        return response;
                    },
                    minCharacters: 3,
                    fields: {
                        results: 'results',
                        title: 'title',
                        description: 'description'
                    },
                    onSelect: function (result, response) {
                        var venueId = result.id;
                        vm.getVenueSetlists(venueId);
                    }
                }
            };
            return options;
        };

    }; //end SearchController


})(); //end closure