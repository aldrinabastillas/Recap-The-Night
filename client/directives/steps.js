(function () {
    angular
        .module('recapApp')
        .directive('steps', Steps);

    /**
     * @summary Displays user's progress on the three steps of the app's workflow.
     * See http://semantic-ui.com/elements/list.html 
     */
    function Steps() {
        var directive = {
            restrict: 'E',
            templateUrl: '/recap/templates/steps.html'
        };
        return directive;
    };

})(); //end closure