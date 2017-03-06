(function () {
    'use strict';
    //var base_url = 'http://localhost:5000';
    var session = new sixpack.Session();
    //var client_id = sixpack.persisted_client_id();
    var client_id = 'test2';
    
    angular
        .module('recapApp')
        .factory('sixpackService', sixpackService);

    sixpackService.$inject = ['$http'];

    function sixpackService($http) {
        
        return {
            participate: participate,
            convert: convert,
        }

        //Public Functions

        /**
         * 
         */
        function convert() {
            return $http.get('/recap/getConvert/' + client_id);
        }; //end convert

        /**
         * Returns the experiment's alternatives,
         * search by artist or by venue, and the client Id
         */
        function participate() {
            return $http.get('/recap/participate/' + client_id)
                .then(getParticipateCompleted)
                .catch(getFailed);
        }; //end participate


        //Private Functions

        function getParticipateCompleted(response) {
            return JSON.parse(response.data);
        };

        function getFailed(error){
            return error;
        };

        

    }; //end sixpackService

})();