(function () {
    'use strict';

    // Modules
    var express = require('express');
    var path = require('path');
    var request = require('request');
    var bodyParser = require('body-parser');
    var multer = require('multer');
    var upload = multer(); // for parsing multipart/form-data
    var querystring = require('querystring');
    var NodeCache = require("node-cache");
    var cache = new NodeCache();
    var setlist = require('./server/setlistModule');
    var spotify = require('./server/spotifyModule');


    // Routes
    var router = express.Router();
    router.use('/', express.static(__dirname + '/client/'));
    router.get('/getArtists/:query', getArtists);
    router.get('/getConvert/:clientId', getConvert);
    router.get('/getArtistSetlists/:artistId', getArtistSetlists);
    router.get('/getVenueSetlists/:venueId', getVenueSetlists);
    router.get('/getVenues/:query', getVenues);
    router.get('/participate/:clientId', getParticipate);
    router.post('/postSetlistSongs', postSetlistSongs);
    router.post('/savePlaylist/:code', savePlaylist);
    router.get('/spotifyLoggedIn', spotifyLoggedIn);
    router.get('/spotifyLogin', spotifyLogin);


    // Export
    module.exports = router;


    // Route Functions


    /**
     * @summary Converts a user given an experiment name and their clientId.
     * Called by searchController.spotifyLogin()
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     * @requires A Sixpack server to be running
     */
    function getConvert(req, res) {
        var endpoint = 'http://localhost:5000/convert?' +
            querystring.stringify({
                experiment: 'recap-search',
                client_id: req.params.clientId
            });

        request.get(endpoint, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                res.json(body);
            }
            else {
                res.status(500).json('convert failed');
            }
        });
    };


    /**
     * @summary Given a free-text query, search for artists in Spotify's library.
     * Called by searchController.artistSearch()
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     */
    function getArtists(req, res) {
        var artist = req.params.query;
        if (artist) {
            setlist.getArtists(artist)
                .then(function (artists) {
                    res.json(artists);
                })
                .catch(function (reason) {
                    //don't send 500 status 
                    //handle manually in http://semantic-ui.com/behaviors/api.html#/usage
                    res.json(reason);
                });
        } else {
            res.status(500).json('query was not provided');
        }
    };


    /**
     * @summary Given an artistId, search setlist.fm for their playlists.
     * Called by setlistService.getArtistSetlists(), which is called by searchController.getArtistSetlists()
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     */
    function getArtistSetlists(req, res) {
        var artistId = req.params.artistId;
        if (artistId) {
            setlist.getArtistSetlists(artistId)
                .then(function (setlists) {
                    res.json(setlists);
                })
                .catch(function (reason) {
                    res.status(404).json(reason);
                });
        } else {
            res.status(500).json('artist was not provided');
        }
    };


    /**
     * @summary Participate in an experiment.
     * Called by sixpackService.participate() which is called by searchController.participate
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     * @requires A Sixpack server to be running
     */
    function getParticipate(req, res) {
        var endpoint = 'http://localhost:5000/participate?' +
            querystring.stringify({
                experiment: 'recap-search',
                alternatives: ['artist', 'venue'],
                //force: 'venue', //for testing!!
                client_id: req.params.clientId
            });

        request.get(endpoint, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                res.json(body);
            }
            else {
                res.status(500).json('participate failed');
            }
        });
    };


    /**
     * @summary Given a free-text search query, search setlist.fm for venues.
     * Called by searchController.venueSearch()
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     */
    function getVenues(req, res) {
        var query = req.params.query;
        if (query) {
            setlist.getVenues(query)
                .then(function (venues) {
                    res.json(venues);
                })
                .catch(function (reason) {
                    //don't send 500 status 
                    //handle manually in http://semantic-ui.com/behaviors/api.html#/usage
                    res.json(reason);
                });
        } else {
            res.status(500).json('query was not provided');
        }
    };


    /**
     * @summary Given a venueId, search setlist.fm for their setlists.
     * Called by onSelect callback in searchController.venueSearch()
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     */
    function getVenueSetlists(req, res) {
        var venueId = req.params.venueId;
        if (venueId) {
            setlist.getVenueSetlists(venueId)
                .then(function (setlists) {
                    res.json(setlists);
                })
                .catch(function (reason) {
                    res.json(reason);
                });
        } else {
            res.status(500).json('venueId was not provided');
        }
    };


    /**
     * @summary Helper function.
     * @param {string} file - rest of path relative to current directory
     * @returns {string} Current root path concatenated with the specified file
     */
    function pathConcat(file) {
        return path.join(__dirname + file);
    };


    /**
     * @summary Given a POST'ed list of songs names, get their info from Spotify.
     * Called from setlistService, which is called by searchController.getSetlistSongs()
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     */
    function postSetlistSongs(req, res) {
        var sets = req.body;
        if (sets) {
            setlist.getSetlistSongs(sets)
                .then(function (songs) {
                    res.json(songs);
                })
                .catch(function (reason) {
                    res.status(500).json(reason);
                });
        } else {
            res.status(500).json('Sets was not provided');
        }
    };


    /**
     * @summary Saves a POST'ed list of songs to Spotify.
     * Called upon page load by loggedInController.js
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     */
    function savePlaylist(req, res) {
        var playlist = req.body;
        var code = req.params.code;

        if (playlist && code) {
            spotify.savePlaylist(req, res, code, playlist)
                .then(function (playlistUri) {
                    res.json(playlistUri);
                })
                .catch(function (reason) {
                    res.status(500).json('Spotify servers returned an error');
                });
        } else {
            res.status(500).json('Spotify servers returned an error');
        }
    };


    /**
     * @summary Redirects to a HTML page that shows the saved playlist.
     * Called by the Spotify authentication redirect
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     */
    function spotifyLoggedIn(req, res) {
        res.sendFile(pathConcat('/client/templates/spotifyLoggedIn.html'));
    };


    /**
     * @summary Redirects to the Spotify authentication page.
     * Called upon loading the popup, /module/recap/client/templates/spotifyLogin.html
     * @param {Object} req - HTTP Request object
     * @param {Object} res - HTTP Response object
     */
    function spotifyLogin(req, res) {
        spotify.spotifyLogin(req, res);
    };

})();