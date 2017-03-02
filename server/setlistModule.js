/* Modules */
var express = require('express');
var keys = require('./privateKeys');
var request = require('request');
var spotify = require('../../shared/server/spotifyApiModule');
var app = express();

/* Public Methods */
/**
 * Given an artist name, search for their most recent setlists
 * @param {string} artist
 */
exports.getSetlists = function (artist) {
    return new Promise(function (resolve, reject) {
        getArtistId(artist).then(function (artistId) {
            //get list of setlists given an artistId
            var url = 'http://api.setlist.fm/rest/0.1/artist/' + artistId + '/setlists.json';
            request.get(url, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var obj = JSON.parse(body);
                    if (obj.setlists.setlist.length > 0) {
                        resolve(obj.setlists.setlist);
                    }
                    else {
                        reject('getSetlists(): Setlist.fm returned an error.');
                    }
                }
            });
        }).catch(function (reason) {
            reject(reason);
        });
    });
}

/**
 * Given set(s) of songs, get each songs' info from Spotify
 * @param sets - contains a set object, or an array of sets
 */
exports.getSetlistSongs = function (sets) {
    return new Promise(function (resolve, reject) {
        var songs = parseSets(sets.sets, sets.artist);

        //call getSongInfo on all songs
        var tasks = songs.map(getSongInfo);
        var setlist = Promise.all(tasks).then(function (response) {
            resolve(response);
        }).catch(function (error) {
            reject(error);
        });
    }); //end promise
};


/* Private Methods*/
/**
 * Given a song title and artist, get details from Spotify
 * like Spotify ID, preview, album art, etc.
 * @param song - Object returned by parseSingleSet 
 */
function getSongInfo(song) {
    return new Promise(function (resolve, reject) {
        spotify.getSong(song.name, song.artist).then(function (response) {
            resolve(response);
        }).catch(function (error) {
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
                reject('getArtistId(): Setlist.fm returned an error.');
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
}

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
}

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
}
