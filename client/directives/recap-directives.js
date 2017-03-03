(function () {
    angular.module('recap-directives', [])
        .directive('setlistSearch', function () {
            return {
                restrict: 'E',
                templateUrl: '/recap/templates/setlistSearch.html',
                controller: 'SetlistController',
                scope: {
                    getSetlists: '&getSetlists',
                },
                link: function (scope, element) {

                    /**
                     * Free-text search Spotify's library for an artist
                     */
                    $('#artistSearch').search({
                        apiSettings: {
                            url: 'https://api.spotify.com/v1/search?q={query}&type=artist',
                            onResponse: function (spotifyResponse) {
                                var response = {
                                    results: []
                                };

                                //iterate through results from Spotify
                                //See https://developer.spotify.com/web-api/search-item/ for structure
                                $.each(spotifyResponse.artists.items, function (i, artist) {
                                    response.results.push({
                                        title: artist.name,
                                        image: (artist.images.length == 3) ? artist.images[0].url : "", //pick smallest image
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
                            var artist = result.title;
                            scope.getSetlists(artist);
                        }
                    }); //end artistSearch
                }
            }
        });
})(); //end closure