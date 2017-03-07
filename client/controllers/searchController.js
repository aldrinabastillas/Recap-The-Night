(function () {
    'use strict';

    angular
        .module('recapApp')
        .controller('SearchController', SearchController);

    SearchController.$inject = ['$http', '$window', 'setlistService', 'sixpackService'];

    function SearchController($http, $window, setlistService, sixpackService) {
        var vm = this; //ViewModel

        //Functions
        vm.artistSearch = artistSearch;
        vm.getArtistSetlists = getArtistSetlists;
        vm.getSetlistSongs = getSetlistSongs;
        vm.getVenueSetlists = getVenueSetlists;
        vm.participate = participate;
        vm.playPreview = playPreview;
        vm.spotifyLogin = spotifyLogin;
        vm.venueSearch = venueSearch;

        //Properties
        vm.error = null;
        vm.playlist = null;
        vm.setlists = null;
        vm.selectedArtist = '';
        vm.selectedSetlistId = '';
        vm.selectedVenueId = '';


        //Function Implementations

        /**
         * Step 1: 
         */
        function artistSearch() {
            var options = {
                apiSettings: {
                    url: '/recap/getArtists/{query}',
                    onResponse: function (spotifyResponse) {
                        var response = { results: [] };

                        if (spotifyResponse.success) {
                            $.each(spotifyResponse.artists, function (i, artist) {
                                response.results.push(artist);
                            });
                        } else {
                            response.results = [{
                                title: 'Not Found',
                                description: 'Try typing more characters'
                            }];
                        }
                        return response;
                    }
                }, //end apiSettings
                fields: { //map results from Spotify to Semantic-UI API
                    results: 'results',
                    title: 'title',
                    image: 'image'
                },
                minCharacters: 3,
                onSelect: function (result, response) {
                    if (result.success != false) {
                        vm.getArtistSetlists(result.title);
                    }
                }
            }; //end options
            return options;
        };


        //function artistSearch() {
        //    var options = {
        //        apiSettings: {
        //            url: 'http://api.spotify.com/v1/search?q={query}&type=artist',
        //            onResponse: function (spotifyResponse) {
        //                var response = { results: [] };

        //                if (spotifyResponse.artists.total > 0) {
        //                    //iterate through results from Spotify
        //                    $.each(spotifyResponse.artists.items, function (i, artist) {
        //                        response.results.push({
        //                            title: artist.name,
        //                            image: (artist.images.length == 3) ? artist.images[0].url : '',
        //                            id: artist.id
        //                        });
        //                    });
        //                } else {
        //                    response.results = [{
        //                        title: 'Not Found',
        //                        description: 'Try typing more characters'
        //                    }];
        //                }

        //                return response;
        //            }
        //        }, //end apiSettings
        //        fields: { //map results from Spotify to Semantic-UI API
        //            results: 'results',
        //            title: 'title',
        //            image: 'image'
        //        },
        //        minCharacters: 3,
        //        onSelect: function (result, response) {
        //            vm.getArtistSetlists(result.title);
        //        }
        //    }; //end options
        //    return options;
        //};


        /**
         * Step 2: Given an artist, display setlists
         * Called by link function in recap-directives.js
         * @param {string} artist
         */
        function getArtistSetlists(artist) {
            setlistService.getArtistSetlists(artist)
                .then(function (response) {
                    vm.selectedArtist = artist;
                    return getSetlistSuccess(response, vm.selectedArtist, artist);
                })
                .catch(function (e) {
                    vm.selectedArtist = artist;
                    vm.error = true;
                    return;
                });
        };


        /**
         * Step 3: Given a setlist, get the songs info from Spotify
         * @param setlist
         */
        function getSetlistSongs(setlist) {
            //sixpackService.convert(); //test complete if user tried to view songs

            if (!setlist.sets) { //no songs were added yet, show link to edit on setlist.fm 
                vm.selectedSetlistId = setlist.id;
                getSetlistSongsCompleted();
                return;
            }

            vm.selectedSetlistId = null; //don't show edit link
            var sets = {
                sets: JSON.stringify(setlist.sets),
                artist: setlist.artist,
                title: setlist.artist + ' @ ' + setlist.venue,
            };

            $('body, .header').css('cursor', 'wait'); //change pointer to loading
            setlistService.postSetlistSongs(sets)
                .then(function (response) {
                    vm.playlist = response;
                    getSetlistSongsCompleted();
                    return response;
                })
                .catch(function (err) {
                    vm.selectedSetlistId = setlist.id;
                    getSetlistSongsCompleted();
                    return;
                });
        }; //end getSetlistSongs

        /**
         * Called when getSetlistSongs completes
         * sucessfully, with errors, or empty setlists
         */
        function getSetlistSongsCompleted() {
            $('#stepTwo').removeClass('active');
            $('#stepThree').addClass('active').removeClass('disabled');
            $('body, .header').css('cursor', 'auto'); //reset mouse pointer
        };


        /**
         * Callback when getVenueSetlists or getArtistSetlists was 
         * successfully called
         * @param {Object} response - HTTP Response object
         * @param {*} last - Previously selected artist or venue
         * @param {*} selected - Currently selected artist or venue
         */
        function getSetlistSuccess(response, last, selected) {
            //jQuery for steps
            $('#stepOne').removeClass('active');
            $('#stepTwo').addClass('active').removeClass('disabled');
            if (last != selected) { //new artist chosen, disable step three
                $('#stepThree').addClass('disabled');
                vm.playlist = null;
            }

            if (response.status !== 404 && response.status !== 500) {
                vm.setlists = response;
                return response;
            } else {
                vm.error = true;
            }
        };


        /**
         * Step 2: Given a venue, display setlists
         * @param {string} venue
         */
        function getVenueSetlists(venueId) {
            setlistService.getVenueSetlists(venueId)
                .then(function (response) {
                    vm.selectedVenueId = venueId;
                    return getSetlistSuccess(response, vm.selectedVenueId, venueId);
                })
                .catch(function (e) {
                    vm.selectedVenueId = venueId;
                    vm.error = true;
                    return;
                });
        };


        /**
         * Called by link function upon page load 
         * of playlist-search direcive
         */
        function participate() {
            return new Promise(function (resolve, reject) {
                sixpackService.participate()
                    .then(function (response) {
                        resolve(response['alternative']['name']);
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
            return;
        };


        /**
         * Opens a new window to do Spotify authentication
         */
        function spotifyLogin() {
            sessionStorage.playlist = JSON.stringify(vm.playlist); //save to sessionStorage
            $window.open('/recap/templates/spotifyLogin.html',
                'Login to Spotify', 'width=700,height=500,left=100,top=100');
            return;
        };


        /**
         * See Semantic-UI Search API
         */
        function venueSearch() {
            var options = {
                apiSettings: {
                    url: '/recap/getVenues/{query}',
                    onResponse: function (venueResponse) {
                        var response = { results: [] };
                        if (venueResponse.success != null && venueResponse.success == false) {
                            response.results = [venueResponse];
                        } else {
                            $.each(venueResponse, function (i, venue) {
                                response.results.push(venue);
                            });
                        }
                        return response;
                    }
                }, //end apiSettings
                fields: {
                    results: 'results',
                    title: 'title',
                    description: 'description'
                },
                minCharacters: 3,
                onSelect: function (result, response) {
                    if (result.success != false) {
                        vm.getVenueSetlists(result.id);
                    }
                }
            }; //end options
            return options;
        }; //end venueSearch

    }; //end SearchController


})(); //end closure