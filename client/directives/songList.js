(function () {
    angular
        .module('recapApp')
        .directive('songList', SongList);

    /**
     * @summary Displays list of songs in a show's setlist
     */
    function SongList() {
        var directive = {
            restrict: 'E',
            templateUrl: '/recap/templates/songList.html'
        };
        return directive;
    };

})(); //end closure