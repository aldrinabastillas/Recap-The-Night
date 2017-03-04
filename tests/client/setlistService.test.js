(function () {
    'use strict';

    describe('SetlistService', function () {
        //Initialize global variables
        var SetlistService,
            $factory,
            $http,
            $q,
            $httpBackend,
            setlists = fakeSetlists(),
            set = fakeSet(),
            playlist = fakePlaylist();

        //Load module
        beforeEach(angular.mock.module('recapApp'));

        //Inject dependencies
        beforeEach(inject(function (_$q_, _$httpBackend_, _$http_, _setlistService_) {
            SetlistService = _setlistService_;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
            $http = _$http_;

        }));

        //Verify Service Loads
        it('should be defined', function () {
            expect(SetlistService).toBeDefined();
        });

        //Factory Method tests
        describe('getSetlists()', getSetlistTests);
        describe('postSetlistSongs()', postSetlistSongsTests);


        /**
         * Test Implementations
         */
        function getSetlistTests() {
            var result;
            beforeEach(function () {
                result = [];
                spyOn(SetlistService, 'getSetlists').and.callThrough();
            });

            //simple test
            it('should return an array of setlists when passed in an artist', function () {
                var artist = 'Japandroids';
                $httpBackend.whenGET('/recap/getSetlists/' + artist)
                    .respond(200, $q.when(setlists));

                expect(SetlistService.getSetlists).not.toHaveBeenCalled();
                expect(result).toEqual([]);

                SetlistService.getSetlists(artist)
                    .then(function (res) {
                        result = res;
                    });
                $httpBackend.flush();

                expect(SetlistService.getSetlists).toHaveBeenCalledWith(artist);
                expect(result).toEqual(setlists);
            });

            //null parameter test
            it('cannot be called if an artist is not passed in', function () {
                SetlistService.getSetlists(null)
                    .catch(function (res) {
                        result = res;
                    });

                expect(SetlistService.getSetlists).toHaveBeenCalledWith(null);
                expect(result).toEqual([]);
            });
        }; //end getSetlistTests


        function postSetlistSongsTests() {
            var result;
            beforeEach(function () {
                result = {};
                spyOn(SetlistService, 'postSetlistSongs').and.callThrough();
            });

            //simple test
            it('should return an array of Spotify data for each song passed in', function () {
                $httpBackend.whenPOST('/recap/postSetlistSongs/', set)
                    .respond(200, $q.when(playlist));

                expect(SetlistService.postSetlistSongs).not.toHaveBeenCalled();
                expect(result).toEqual({});

                SetlistService.postSetlistSongs(set)
                    .then(function (res) {
                        result = res;
                    });
                $httpBackend.flush();

                expect(SetlistService.postSetlistSongs).toHaveBeenCalledWith(set);
                expect(result).toEqual(playlist);
            });


            //null parameter
            it('cannot be called if a setlist is not POSTed', function () {
                SetlistService.postSetlistSongs(null)
                    .catch(function (res) {
                        result = res;
                    });

                expect(SetlistService.postSetlistSongs).toHaveBeenCalledWith(null);
                expect(result).toEqual({});
            });
        }; //end postSetlistSongTests

        /**
         * Fakes Implementations
         */

        /**
         * Return a mock list of setlists to be returned
         */
        function fakeSetlists() {
            //Mock a list of setlists
            var setlists = [
                {
                    date: new Date(2017, 1, 25),
                    venue: 'Union Transfer, Philadelphia',
                    sets: {
                        set: {
                            song: [{ '@name': 'The House That Heaven Built' }],
                        }
                    }
                },
                {
                    date: new Date(2017, 1, 24),
                    venue: 'Union Transfer, Philadelphia',
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
                    ] //end sets
                } //end setlists[1]
            ];
            return setlists;
        };

        /**
         * Return a mock set to be POSTed
         */
        function fakeSet() {
            var set = {
                artist: 'Japandroids',
                title: 'Japandroids @ Union Transfer',
                sets: [{
                    set: {
                        song: [{ '@name': 'Near To The Wild Heart Of Life' }],
                    }
                }]
            };
            return set;
        };

        /**
         * Return a mock Spotify Playlist to be returned
         */
        function fakePlaylist() {
            var playlist = {
                title: 'Japandroids @ Union Transfer',
                songs: [{
                    album: 'Near To The Wild Heart Of Life',
                    artist: 'Japandroids',
                    id: '4aQSJS43Lwfc6egUwKbXhb',
                    image: 'https://i.scdn.co/image/70821687c69039af5545c5bed36d944888bfe22a',
                    name: 'Near To The Wild Heart Of Life',
                    preview: 'https://p.scdn.co/mp3-preview/a83f04e7528477a6f82cfda27830cc120a8b260f?cid=3af0f',
                    uri: 'spotify:track:4aQSJS43Lwfc6egUwKbXhb'
                }]
            };
            return playlist;
        };

    });

})(); 