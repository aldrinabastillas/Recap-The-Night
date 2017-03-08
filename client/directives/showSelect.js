(function () {
    angular
        .module('recapApp')
        .directive('showSelect', ShowSelect);

    /**
     * @summary Displays a list of shows to choose from.
     */
    function ShowSelect() {
        var directive = {
            restrict: 'E',
            templateUrl: '/recap/templates/showSelect.html'
        };
        return directive;
    };

})(); 