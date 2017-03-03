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
    var instagram = require('./server/instagramModule');


    /**
     * Routes
     */
    var router = express.Router();
    router.use('/', express.static(__dirname + '/client/'));


    /**
     * Called from /module/recap/client/module/setlistSearch.html
     */
    router.get('/getSetlists/:artist', (req, res) => {
        var artist = req.params.artist;
        if (artist) {
            setlist.getSetlists(artist).then(function (setlists) {
                res.json(setlists);
            }).catch(function (reason) {
                res.status(500).json(reason);
            });
        } else {
            res.status(500).json('artist was not provided');
        }
    });


    /**
     * Called from /module/recap/client/templates/setlistSearch.html
     */
    router.post('/getSetlistSongs', (req, res) => {
        var sets = req.body;
        if (sets) {
            setlist.getSetlistSongs(sets).then(function (songs) {
                res.json(songs);
            }).catch(function (reason) {
                res.status(500).json(reason);
            });
        } else {
            res.status(500).json('Sets was not provided');
        }
    });


    /**
     * Called from /module/recap/client/templates/spotifyLogin.html
     * Redirects to the Spotify authentication page
     */
    router.get('/spotifyLogin', (req, res) => {
        spotify.spotifyLogin(res);
    });


    /**
     * Called from /module/recap/client/templates/instagramLogin.html
     * Redirects to the Instagram authentication page
     */
    router.get('/instagramLogin', (req, res) => {
        instagram.instagramLogin(res);
    });


    /**
     * Called by authentication redirect
     * Redirects to a HTML page that shows the saved playlist
     */
    router.get('/spotifyLoggedIn', (req, res) => {
        var code = req.query.code;
        //var state = req.query.state; //TODO: make cache user specific
        if (code) {
            res.cookie('spotifyCode', code);
            cache.set('spotifyCode', code);
            res.sendFile(pathConcat('/client/templates/spotifyLoggedIn.html'));
        } else {
            res.sendFile(pathConcat('/client/templates/spotifyError.html'));
        }
    });


    /**
     * Called by authentication redirect
     * Redirects to a HTML page that just closes itself
     */
    router.get('/instagramLoggedIn', (req, res) => {
        var code = req.query.code;
        if (code) {
            cache.set('instagramCode', code); //save in server cache
            //instagram.getTokenWithCode(req, res, code);
            res.sendFile(pathConcat('/client/templates/instagramLoggedIn.html'));
        } else {
            res.status(500).json('authentication code not received');
        }
    });


    /**
     * 
     */
    router.get('/instagramSearch/:artist', (req, res) => {
        var artist = req.params.artist;
        var code = cache.get('instagramCode');
        if (artist && code) {
            instagram.instagramSearch(artist, code, req, res).then(function (media) {
                res.json(media);
            }).catch(function (reason) {
                res.status(500).json(reason);
            });
        } else {
            res.status(500).json('artist was not provided');
        }
    });


    /**
     * Saves a list of songs to Spotify
     * Called by loggedInController.js
     * Gets songs from the POST body and the code from the cache
     */
    router.post('/savePlaylist', (req, res) => {
        var playlist = req.body;
        var code = cache.get('spotifyCode');
        if (playlist) {
            spotify.savePlaylist(req, res, code, playlist).then(function (playlistUri) {
                res.json(playlistUri);
            }).catch(function (reason) {
                res.status(500).json(reason);
            });
        } else {
            res.status(500).json('Could not save playlist');
        }
    });


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