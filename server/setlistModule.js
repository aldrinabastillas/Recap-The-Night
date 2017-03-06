(function () {
    'use strict';
    //Modules
    var express = require('express');
    var app = express();
    var request = require('request');
    var spotify = require('./spotifyPlaylistModule');
    var token = require('../../shared/server/spotifyQueryModule');
    var parse = require('./setlistParseModule');
    var querystring = require('querystring');


    //Public Functions
    exports.getArtistSetlists = getArtistSetlists;
    exports.getSetlistSongs = getSetlistSongs;
    exports.getVenues = getVenues;
    exports.getVenueSetlists = getVenueSetlists;


    //Function Implementations

    /**
     * See http://api.setlist.fm/docs/rest.0.1.search.artists.html
     * @param {string} artist - free text
     */
    function getArtistId(artist) {
        return new Promise(function (resolve, reject) {
            var param = artist.replace(new RegExp(' ', 'g'), '+');
            var url = 'http://api.setlist.fm/rest/0.1/search/artists.json?artistName=' + param;

            request.get(url, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var obj = JSON.parse(body);
                    //could be multiple results, due to collaborations
                    if (obj.artists.artist.length > 0) {
                        obj.artists.artist.forEach(function(item){
                            //found exact name match
                            if(artist.toLowerCase() == item['@name'].toLowerCase()){
                                resolve(item['@mbid']);
                            }
                        });
                        resolve(obj.artists.artist[0]['@mbid']); //default first result
                    }
                    else if (obj.artists.artist) { //only one match found
                        resolve(obj.artists.artist['@mbid']);
                    }
                }
                else {
                    reject(artist + ': ' + body);
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
                            var setlists = parse.parseSetlists(body.setlists.setlist);
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
     * Given set(s) of songs, get each songs' info from Spotify
     * @param sets - contains a set object, or an array of sets
     */
    function getSetlistSongs(sets) {
        return new Promise(function (resolve, reject) {
            var songs = parse.parseSets(sets.sets, sets.artist);

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
    };


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
                    var venues = parse.parseVenues(body.venues.venue);
                    resolve(venues);
                }
                else {
                    var failure = {
                        success: false,
                        title: 'Not Found',
                        description: 'Try typing more characters'
                    };

                    resolve(failure);
                }
            });
        });
    };


     /**
     * Given a venueId, search for their most recent setlists
     * @param {string} venueId
     */
    function getVenueSetlists(venueId) {
        return new Promise(function (resolve, reject) {
            //cache a Spotify Access token ahead of time for later queries
            token.getAccessToken();

            var url = 'http://api.setlist.fm/rest/0.1/search/setlists.json?venueId=' + venueId;
            request.get(url, function(error, response, body){
                if(!error && response.statusCode === 200){
                    body = JSON.parse(body);
                    var setlists = parse.parseSetlists(body.setlists.setlist);
                    resolve(setlists);
                } else{
                    reject(venueId + ': ' + body);
                }
            });
        });
    }; //get getVenueSetlists

})();