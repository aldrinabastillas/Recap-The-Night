(function () {
    angular
        .module('recapApp')
        .factory('setlistService', setlistService);

    setlistService.$inject = ['$http'];


    function setlistService($http) {
        return {
            getArtistSetlists: getArtistSetlists,
            getVenueSetlists: getVenueSetlists,
            postSetlistSongs: postSetlistSongs,
        };


        /**
         * Call out to getArtistSetlists endpoint
         * @param artist
         */
        function getArtistSetlists(artist) {
            return $http.get('/recap/getArtistSetlists/' + artist)
                .then(getCompleted)
                .catch(getFailed);
        };


        /**
         * Call out to getVenueSetlists endpoint
         * @param artist
         */
        function getVenueSetlists(venueId) {
            return $http.get('/recap/getVenueSetlists/' + venueId)
                .then(getCompleted)
                .catch(getFailed);
        };

        /**
         * 
         * @param {*} sets 
         */
        function postSetlistSongs(sets) {
            return $http.post('/recap/postSetlistSongs/', sets)
                .then(getCompleted)
                .catch(getFailed);
        }

        /**
         * 
         * @param {*} response 
         */
        function getCompleted(response) {
            return response.data;
        };

        /**
         * 
         * @param {*} error 
         */
        function getFailed(error) {
            return error;
        };
    }; // end setlistService

})();