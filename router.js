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
var login = require('./server/spotifyLoginModule'); 

/**
 * Routes
 */
var router = express.Router();
router.use('/', express.static(__dirname + '/client/'));
function Path(file) {
    return path.join(__dirname + file);
}

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
    }
    else {
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
    }
    else {
        res.status(500).json('Sets was not provided');
    }
});

/**
 * Called from /module/recap/client/templates/spotifyLogin.html
 * Redirects to the Spotify authentication page
 */
router.get('/spotifyLogin', (req, res) => {
    login.spotifyLogin(res);
});

/**
 * Called by authentication redirect
 * Redirects to a HTML page that just closes itself
 */
router.get('/loginCompleted', (req, res) => {
    var code = req.query.code;
    if (code) {
        res.cookie('code', code);
        cache.set('code', code);
        res.sendFile(Path('/client/templates/loginCompleted.html'));
    }
    else {
        var error = req.query.error;
        res.status(500).json(error);
    }
});

/**
 * Saves a list of songs to Spotify
 * Gets songs from the POST body and the code from the cache
 */
router.post('/savePlaylist', (req, res) => {
    var playlist = req.body;
    var code = cache.get('code');
    if (playlist) {
        login.savePlaylist(req, res, code, playlist).then(function (playlistUri) {
            res.json(playlistUri);
        }).catch(function (reason) {
            res.status(500).json(reason);
        });
    }
    else {
        res.status(500).json('Could not save playlist');
    }
});

/**
 * Export
 */
module.exports = router;