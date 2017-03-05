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

                //Get an experiment alterntative and change UI appropriately
                var search = scope.sc.artistSearch();
                var alt = scope.sc.participate()
                    .then(function (alt) {
                        console.log('alt: ' + alt);
                        if (alt == 'venue') {
                            $('#stepOneTitle').html('Venue');
                            $('#stepOneIcon').removeClass('users').addClass('building');
                            search = scope.sc.venueSearch();
                            $('#searchPrompt').search(search);
                        }
                    });

                // Free-text search for either an artist or venue
                $('#searchPrompt').search(search);

            } //end link function
        }
        return directive;
    }; //end ArtistSearch

})(); //end closure