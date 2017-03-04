(function () {
    angular
        .module('recapApp')
        .directive('artistSearch', ArtistSearch);

    function ArtistSearch() {
        var directive = {
            restrict: 'E',
            templateUrl: '/recap/templates/artistSearch.html',
            controller: 'SearchController',
            controllerAs: 'sc',
            bindToController: true,
            link: function (scope, element) {

                // jQuery to control step element
                $('#stepOne').click(function () {
                    $('#artistSearch').removeClass('ng-hide');
                    $('#showList').addClass('ng-hide');
                    $('#songList').addClass('ng-hide');
                });

                $('#stepTwo').click(function () {
                    $('#artistSearch').addClass('ng-hide');
                    $('#showList').removeClass('ng-hide');
                    $('#songList').addClass('ng-hide');
                });

                $('#stepThree').click(function () {
                    $('#artistSearch').addClass('ng-hide');
                    $('#showList').addClass('ng-hide');
                    $('#songList').removeClass('ng-hide');
                });

                
                // Free-text search Spotify's library for an artist
                $('#artistSearch').search({
                    apiSettings: {
                        url: 'https://api.spotify.com/v1/search?q={query}&type=artist',
                        onResponse: function (spotifyResponse) {
                            var response = {
                                results: []
                            };

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
                        var artist = result.title;
                        scope.sc.getSetlists(artist);
                    }
                }); //end artistSearch
            } //end link function
        }
        return directive;
    }; //end ArtistSearch

})(); //end closure