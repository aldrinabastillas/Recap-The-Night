(function () {
    'use strict';
    // var client_id = Date.now() + '-' + generateRandomString(4); 
    var random_id = sixpack.persisted_client_id();
    var base_url = 'http://localhost:5000'

    // var session = new sixpack.Session({
    //     client_id: client_id,
    //     base_url: 'http://localhost:5000'
    // });

    angular
        .module('recapApp')
        .factory('sixpackService', sixpackService);

    sixpackService.$inject = ['$http'];


    function sixpackService($http) {
        return {
            participate: participate,
            convert: convert,
        }

        /**
         * Simply returns the experiment's alternative, 
         * either searching by artist or by venue
         */
        function participate() {
            return $http.get('/recap/participate/' + random_id)
                .then(getCompleted)
                .catch(getFailed);
        }; //end participate

        function getCompleted(response) {
            var data = JSON.parse(response.data);
            return data['alternative']['name'];
        };

        function getFailed(error){
            return error;
        };

        /**
         * 
         */
        function convert() {
            session.convert('recap-search', function (err, res) {
                if (err) throw err;
                return res;
            });
        }; //end convert

    }; //end sixpackService

})();