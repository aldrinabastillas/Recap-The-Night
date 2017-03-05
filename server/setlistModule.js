(function () {
    'use strict';
    /**
     * Modules
     */
    var express = require('express');
    var request = require('request');
    var spotify = require('./spotifyPlaylistModule');
    var token = require('../../shared/server/spotifyQueryModule');
    var app = express();

    /** 
     * Public Functions
     */
    exports.getSetlists = getSetlists;
    exports.getSetlistSongs = getSetlistSongs;
    exports.getVenues = getVenues;

    /**
     * Function Implementations
     */

    /**
     * 
     * @param {string} query - 
     */
    function getVenues(query) {
        return new Promise(function (resolve, reject) {
            var endpoint = 'http://api.setlist.fm/rest/0.1/search/venues.json?name=' + query
            request.get(endpoint, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    body = JSON.parse(body);
                    var venues = parseVenues(body.venues.venue);
                    resolve(venues);
                }
                else {
                    reject(query + ': ' + body);
                }
            });
        });
    };


    /**
     * Given an artist name, search for their most recent setlists
     * @param {string} artist
     */
    function getArtistSetlists(artist) {
        return new Promise(function (resolve, reject) {
            //cache a Spotify Access token ahead of time for later queries
            token.getAccessToken();

            getArtistId(artist)
                .then(function (artistId) {
                    //get list of setlists given an artistId
                    var url = 'http://api.setlist.fm/rest/0.1/artist/' + artistId + '/setlists.json';
                    request.get(url, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            body = JSON.parse(body);
                            var setlists = parseSetlists(body.setlists.setlist);
                            resolve(setlists);
                        }
                        else {
                            reject(artist + ': ' + body);
                        }
                    });
                })
                .catch(function (reason) {
                    reject(reason);
                });
        });
    };


     /**
     * Given an artist name, search for their most recent setlists
     * @param {string} artist
     */
    function getArtistSetlists(venueId) {
        return new Promise(function (resolve, reject) {
            //cache a Spotify Access token ahead of time for later queries
            token.getAccessToken();

//TODO:
            // getArtistId(artist)
            //     .then(function (artistId) {
            //         //get list of setlists given an artistId
            //         var url = 'http://api.setlist.fm/rest/0.1/artist/' + artistId + '/setlists.json';
            //         request.get(url, function (error, response, body) {
            //             if (!error && response.statusCode === 200) {
            //                 body = JSON.parse(body);
            //                 var setlists = parseSetlists(body.setlists.setlist);
            //                 resolve(setlists);
            //             }
            //             else {
            //                 reject(artist + ': ' + body);
            //             }
            //         });
            //     })
            //     .catch(function (reason) {
            //         reject(reason);
            //     });
        });
    };
    /**
     * Given set(s) of songs, get each songs' info from Spotify
     * @param sets - contains a set object, or an array of sets
     */
    function getSetlistSongs(sets) {
        return new Promise(function (resolve, reject) {
            var songs = parseSets(sets.sets, sets.artist);

            //call getSongInfo on all songs
            var tasks = songs.map(getSongInfo);
            var setlist = Promise.all(tasks)
                .then(function (response) {
                    var playlist = {
                        title: sets.title,
                        songs: response
                    };

                    resolve(playlist);
                })
                .catch(function (error) {
                    reject(error);
                });
        }); //end promise
    };


    /**
     * Given a song title and artist, get details from Spotify
     * like Spotify ID, preview, album art, etc.
     * Called by getSetlistSongs
     * @param song - Object returned by parseSingleSet 
     */
    function getSongInfo(song) {
        return new Promise(function (resolve, reject) {
            spotify.getSong(song.name, song.artist)
                .then(function (response) {
                    resolve(response);
                })
                .catch(function (error) {
                    //if not found in spotify, just return the song and artist name
                    resolve(song);
                });
        });
    }


    /**
     * See http://api.setlist.fm/docs/rest.0.1.search.artists.html
     * @param {string} artist - free text
     */
    function getArtistId(artist) {
        return new Promise(function (resolve, reject) {
            var url = 'http://api.setlist.fm/rest/0.1/search/artists.json?artistName=' + artist;

            request.get(url, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var obj = JSON.parse(body);
                    if (obj.artists.artist.length > 0) {
                        resolve(obj.artists.artist[0]['@mbid']);
                    }
                    else if (obj.artists.artist) {
                        resolve(obj.artists.artist['@mbid']);
                    }
                }
                else {
                    reject(artist + ': ' + body);
                }
            });
        });
    }

    /**
     * Given a setlistId, return all the songs. Not currently used
     * @param setlistId - A setlist id from setlist.fm
     */
    function getSongNames(setlistId) {
        return new Promise(function (resolve, reject) {
            var url = 'http://api.setlist.fm/rest/0.1/setlist/' + setlistId + '.json';

            request.get(url, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    //loop through all songs in all sets
                    var obj = JSON.parse(body);
                    var songs = parseSets(obj.setlist.sets, obj.setlist.artist['@name']);
                    resolve(songs);
                }
                else {
                    reject('Setlist.fm returned an error.');
                }
            });
        });
    };

    function parseVenues(venues) {
        var venueArr = [];

        if(venues.length > 0){
            venues.forEach(function (venue) {
                venueArr.push(parseVenue(venue));
            });
        } else{
            venueArr.push(parseVenue(venues));
        }

        return venueArr;
    };


    function parseVenue(venue) {
        var city = venue['city']['@name'];
        var country = venue['city']['country']['@name']
        var description = (country) ? city + ', ' + country : city;
        return {
            id: venue['@id'],
            title: venue['@name'],
            description: description
        };
    };


    /**
     * 
     * @param setlists
     */
    function parseSetlists(setlists) {
        var setlistArr = [];
        setlists.forEach(function (item) {
            setlistArr.push({
                date: parseDate(item['@eventDate']),
                venue: item['venue']['@name'] + ', ' + item['venue']['city']['@name'],
                id: item['@id'],
                sets: item['sets']
            });
        });
        return setlistArr;
    };


    /**
     * Parse dates from Setlist.fm into JS format: year, month (0-11), date
     * @param {string} dateString - Dates from setlist.fm are 'DD-MM-YYY'
     */
    function parseDate(dateString) {
        var split = dateString.split('-');
        return new Date(split[2], split[1] - 1, split[0]);
    }; //end parseDate


    /**
     * Given a sets object, which may have one set object, or an array of sets
     * return a single array of songs
     * @param sets
     * @param {string} artist
     */
    function parseSets(sets, artist, res, req) {
        var sets = JSON.parse(sets);
        var songs = [];
        if (sets.set.length > 0) { //if there is an array of multiple sets
            sets.forEach(function (set) {
                songs = songs.concat(parseSingleSet(set, artist));
            });
        }
        else if (sets.set.song.length > 0) { //only one set object, check if there are songs
            songs = parseSingleSet(sets.set, artist);
        }
        return songs;
    };

    /**
     * Given a set of songs, return an array of objects that just has
     * the song name and artist. If the song is not a cover, use the
     * provided artist
     * @param set -
     * @param {string} artist
     */
    function parseSingleSet(set, artist, res, req) {
        var songs = [];
        if (set.song.length > 0) {
            set.song.forEach(function (song) {
                var songArtist = (song.cover && song.cover['@name']) ? song.cover['@name'] : artist;
                songs.push({
                    name: song['@name'],
                    artist: songArtist,
                });
            });
        }
        return songs;
    };

})();