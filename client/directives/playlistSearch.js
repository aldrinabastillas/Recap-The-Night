
(function () {
    angular
        .module('recapApp')
        .directive('playlistSearch', PlaylistSearch);

    /**
     * @summary Input element to search for artists or venues, depending on A/B test
     * @returns - http://semantic-ui.com/modules/search.html
     */
    function PlaylistSearch() {
        var directive = {
            restrict: 'E',
            templateUrl: '/recap/templates/playlistSearch.html',
            controller: 'SearchController',
            controllerAs: 'sc',
            bindToController: true,
            link: function (scope, element) {
                // jQuery to control step elements
                $('#stepOne').click(function () {
                    $('#searchPrompt').removeClass('ng-hide');
                    $('#showList').addClass('ng-hide');
                    $('#songList').addClass('ng-hide');
                });

                $('#stepTwo').click(function () {
                    $('#searchPrompt').addClass('ng-hide');
                    $('#showList').removeClass('ng-hide');
                    $('#songList').addClass('ng-hide');
                });

                $('#stepThree').click(function () {
                    $('#searchPrompt').addClass('ng-hide');
                    $('#showList').addClass('ng-hide');
                    $('#songList').removeClass('ng-hide');
                });

                //Get an experiment alternative and change UI appropriately
                var search = scope.sc.artistSearch();
                // **comment out, sixpack server not current running in prod**
                //var alt = scope.sc.participate(); 
                //    .then(function (alt) {
                //        if (alt == 'venue') {
                //            $('#stepOneTitle').html('Venue');
                //            $('#stepOneIcon').removeClass('users').addClass('building');
                //            search = scope.sc.venueSearch();
                //            $('#searchPrompt').search(search);
                //        }
                //    });

                // Free-text search for either an artist or venue
                $('#searchPrompt').search(search);

            } //end link function
        };
        return directive;
    }; //end ArtistSearch

})(); //end closure 
