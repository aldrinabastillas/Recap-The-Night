(function () {
    'use strict';

    describe('SearchController', function () {
        // Initialize global variables
        var SearchController,
            SetlistService,
            $controller,
            $scope,
            $http,
            $window,
            $q,
            $httpBackend,
            setlists = fakeSetlist();

        //Load controller's module
        beforeEach(angular.mock.module('recapApp'));

        //Inject controller dependencies
        beforeEach(inject(function (_$controller_, _setlistService_, $rootScope, _$q_, _$httpBackend_) {
            $controller = _$controller_;
            SetlistService = _setlistService_;
            $q = _$q_;
            $httpBackend = _$httpBackend_;

            $scope = $rootScope.$new(); //Set new global scope

            //Initialize controller and its dependencies
            SearchController =
                $controller('SearchController', {
                $scope: $scope,
                $http: $http,
                $window: $window,
                SetlistService: SetlistService
            });

        })); //end beforeEach


        //Verify controller loads
        it('should be defined', function () {
            expect(SearchController).toBeDefined();
        });

        //Behavior tests
        describe('getSetlists()', getSetlistTests);


        /**
         * Test Implementations
         */
        function getSetlistTests() {
            beforeEach(function () {
                //Force return value of factory
                //spyOn(SetlistService, 'getSetlists').and.callFake(function () {
                //    return $.Deferred().resolve(setlists);
                //});
                spyOn(SetlistService, 'getSetlists').and.callThrough();
            });

            it('should retrieve setlists', function () {
                //TODO: https://scotch.io/tutorials/testing-angularjs-with-jasmine-and-karma-part-2
                expect(SearchController.getSetlists()).toEqual(setlists);
                expect(SetlistService.getSetlists).toHaveBeenCalled();
            });
        }

        
        /**
         * Fakes Implementations
         */

        /**
         * Return a mock setlist
         */
        function fakeSetlist() {
            //Mock a list of setlists
            var setlists = [
                {
                    date: new Date(2017, 1, 25),
                    venue: 'Union Transfer @ Philadelphia',
                    sets: {
                        set: {
                            song: [{ '@name': 'The House That Heaven Built' }],
                        }
                    }
                },
                {
                    date: new Date(2017, 1, 24),
                    venue: 'Union Transfer @ Philadelphia',
                    sets: [
                        {
                            set: {
                                song: [{ '@name': 'Young Hearts Spark Fire' }],
                            }
                        },
                        {
                            set: {
                                song: [{ '@name': 'Encore' }],
                            }
                        }

                    ]
                }
            ];
            return setlists;
        };
    }); //end describe SearchController

    

})();