(function () {
    angular
        .module('recapApp')
        .factory('setlistService', setlistService);

    setlistService.$inject = ['$http'];

    function setlistService($http) {
        return {
            getSetlists: getSetlists,
            postSetlistSongs: postSetlistSongs,
        };

        /**
         * Call out to getSetlists endpoint
         * @param artist
         */
        function getSetlists(artist) {
            return $http.get('/recap/getSetlists/' + artist)
                .then(getCompleted)
                .catch(getFailed);
        };

        function postSetlistSongs(sets) {
            return $http.post('/recap/postSetlistSongs/', sets)
                .then(getCompleted)
                .catch(getFailed);
        }

        function getCompleted(response) {
            return response.data;
        };

        function getFailed(error) {
            return error;
        };
    }

})();