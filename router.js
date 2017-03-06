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
    var spotify = require('./server/spotifyPlaylistModule');


    // Routes
    var router = express.Router();
    router.use('/', express.static(__dirname + '/client/'));
    router.get('/getConvert/:clientId', getConvert);
    router.get('/getArtistSetlists/:artist', getArtistSetlists);
    router.get('/getVenueSetlists/:venueId', getVenueSetlists);
    router.get('/getVenues/:query', getVenues);
    router.get('/participate/:clientId', getParticipate);
    router.post('/postSetlistSongs', postSetlistSongs);
    router.post('/savePlaylist/:code', savePlaylist);
    router.get('/spotifyLoggedIn', spotifyLoggedIn);
    router.get('/spotifyLogin', spotifyLogin);

    // Export
    module.exports = router;


    //Route Functions

    /**
     * 
     * @param {*} req 
     * @param {*} res 
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
     * 
     * @param {*} req - HTTP Request
     * @param {*} res 
     */
    function getArtistSetlists(req, res) {
        var artist = req.params.artist;
        if (artist) {
            setlist.getArtistSetlists(artist)
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
     * 
     * @param {*} req 
     * @param {*} res 
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
     * 
     * @param {*} req 
     * @param {*} res 
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
     * 
     * @param {*} req 
     * @param {*} res 
     */
    function getParticipate(req, res) {
        var endpoint = 'http://localhost:5000/participate?' +
            querystring.stringify({
                experiment: 'recap-search',
                alternatives: ['artist', 'venue'],
                //force: 'venue', //for testing!
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
     * Helper function for joining current root path and the specified file
     * @param {string} file - rest of path relative to current directory
     */
    function pathConcat(file) {
        return path.join(__dirname + file);
    };


    /**
     * Called from /module/recap/client/templates/setlistSearch.html
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
     * Saves a list of songs to Spotify
     * Called by loggedInController.js
     * Gets songs from the POST body and the code from the cache
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
     * Called by authentication redirect
     * Redirects to a HTML page that shows the saved playlist
     */
    function spotifyLoggedIn(req, res) {
        res.sendFile(pathConcat('/client/templates/spotifyLoggedIn.html'));
    };


    /**
     * Called from /module/recap/client/templates/spotifyLogin.html
     * Redirects to the Spotify authentication page
     */
    function spotifyLogin(req, res) {
        spotify.spotifyLogin(res);
    };

})();