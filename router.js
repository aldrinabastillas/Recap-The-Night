(function () {
    'use strict';
    /** 
     * Modules
     */
    var express = require('express');
    var path = require('path');
    var bodyParser = require('body-parser');
    var multer = require('multer');
    var upload = multer(); // for parsing multipart/form-data
    var NodeCache = require("node-cache");
    var cache = new NodeCache();
    var setlist = require('./server/setlistModule');
    var spotify = require('./server/spotifyPlaylistModule');


    /**
     * Routes
     */
    var router = express.Router();
    router.use('/', express.static(__dirname + '/client/'));
    router.get('/getSetlists/:artist', getSetlists);
    router.post('/postSetlistSongs', postSetlistSongs);
    router.post('/savePlaylist', savePlaylist);
    router.get('/spotifyLoggedIn', spotifyLoggedIn);
    router.get('/spotifyLogin', spotifyLogin);


    /**
     * Called from /module/recap/client/module/setlistSearch.html
     */
    function getSetlists(req, res) {
        var artist = req.params.artist;
        if (artist) {
            setlist.getSetlists(artist)
                .then(function (setlists) {
                    res.json(setlists);
                })
                .catch(function (reason) {
                    res.status(500).json(reason);
                });
        } else {
            res.status(500).json('artist was not provided');
        }
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
        var code = cache.get('spotifyCode');
        if (playlist) {
            spotify.savePlaylist(req, res, code, playlist)
                .then(function (playlistUri) {
                    res.json(playlistUri);
                })
                .catch(function (reason) {
                    res.status(500).json(reason);
                });
        } else {
            res.status(500).json('Could not save playlist');
        }
    };


    /**
     * Called by authentication redirect
     * Redirects to a HTML page that shows the saved playlist
     */
    function spotifyLoggedIn(req, res) {
        var code = req.query.code;
        //var state = req.query.state; //TODO: make cache user specific
        if (code) {
            res.cookie('spotifyCode', code);
            cache.set('spotifyCode', code);
            res.sendFile(pathConcat('/client/templates/spotifyLoggedIn.html'));
        } else {
            res.sendFile(pathConcat('/client/templates/spotifyError.html'));
        }
    };


    /**
     * Called from /module/recap/client/templates/spotifyLogin.html
     * Redirects to the Spotify authentication page
     */
    function spotifyLogin(req, res) {
        spotify.spotifyLogin(res);
    };


    /**
     * Helper function for joining current root path and the specified file
     * @param {string} file - rest of path relative to current directory
     */
    function pathConcat(file) {
        return path.join(__dirname + file);
    };


    /**
     * Export
     */
    module.exports = router;

})();