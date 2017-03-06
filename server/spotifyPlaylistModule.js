(function () {
    'use strict';
    // Modules
    var express = require('express');
    var app = express();
    var keys = require('./privateKeys');
    var request = require('request');
    var querystring = require('querystring');
    var spotify = require('../../shared/server/spotifyQueryModule.js');
    var cookieParser = require('cookie-parser');
    app.use(cookieParser());

    // Private Properties
    var stateKey = 'spotify_auth_state';
    var client_id = keys.spotify_client_id; // Your client id
    var redirect_uri = keys.spotify_redirect_uri; // Your redirect uri
    var client_secret = keys.spotify_client_secret; // Your secret

    //Public Functions
    exports.getSong = getSong;
    exports.savePlaylist = savePlaylist;
    exports.spotifyLogin = spotifyLogin;

    /**
     * Explicit OAuth
     * See https://developer.spotify.com/web-api/authorization-guide/#authorization-code-flow
     * @param res - HTTP Request object
     */
    function spotifyLogin(res) {
        var state = generateRandomString(16);
        res.cookie(stateKey, state);

        var scope = 'user-read-private playlist-modify-private'; //authorization

        res.redirect('https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                state: state
            })
        );
    }; //end spotifyLogin


    /**
     * Called from getSongInfo() in setlistModule.js
     * @param {string} song - Song title
     * * @param {string} artist - Artist name
     */
    function getSong(song, artist) {
        return new Promise(function (resolve, reject) {
            var endpoint = 'https://api.spotify.com/v1/search'
            var params = '?q=track:' + song + ' artist:' + artist + '&type=track';
            spotify.getSpotifyQuery(endpoint + params).then(function (result) {
                if (result.tracks.total > 0) {
                    var tempSong = result.tracks.items[0];
                    var info = {
                        id: tempSong['id'],
                        name: tempSong['name'],
                        preview: tempSong['preview_url'],
                        uri: tempSong['uri'],
                        image: tempSong.album.images[2]['url'],
                        album: tempSong.album['name'],
                        artist: tempSong.artists[0]['name'],
                    };
                    resolve(info);
                } else {
                    reject(reason);
                }
            }).catch(function (reason) {
                reject(reason);
            });

        });
    }; //end getSong


    /**
     * TODO: http://solutionoptimist.com/2013/12/27/javascript-promise-chains-2/
     */
    function savePlaylist(req, res, code, playlist) {
        return new Promise(function (resolve, reject) {
            //1: Exchange User Code for Access Token
            getTokenWithCode(req, res, code).then(function (accessToken) {
                //2: Get User ID
                getUserId(accessToken).then(function (userId) {
                    //3: Create Playlist 
                    createPlaylist(userId, accessToken, playlist.title).then(function (newPlaylist) {
                        //4: Add Tracks to Playlist
                        addPlaylistSongs(userId, accessToken, newPlaylist.id, playlist.songs).then(function (snapshotId) {
                            var playlist = newPlaylist.uri.replace(new RegExp(':', 'g'), '%3A');
                            var url = 'https://embed.spotify.com/?uri=' + playlist;
                            resolve(url);
                        }).catch(function (err) {
                            reject(err);
                        });
                    }).catch(function (err) {
                        reject(err);
                    });
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    }; //end savePlaylist


    //Private Functions 

    /*
     *
     */
    function addPlaylistSongs(userId, accessToken, playlistId, songs) {
        return new Promise(function (resolve, reject) {
            var body = {
                uris: [],
            }

            songs.forEach(function (song) {
                if(song.uri){
                    body.uris.push(song.uri);
                }
            });

            var endpoint = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks';
            spotify.postSpotifyData(endpoint, accessToken, body).then(function (response) {
                resolve(response.snapshot_id);
            }).catch(function (err) {
                reject(err);
            });
        });
    }; //end addSongs


    /**
     * 
     * @param userId
     * @param accessToken
     * @param playlistTitle
     */
    function createPlaylist(userId, accessToken, playlistTitle) {
        return new Promise(function (resolve, reject) {
            var body = {
                name: playlistTitle,
                public: false
            }

            var endpoint = 'https://api.spotify.com/v1/users/' + userId + '/playlists';

            spotify.postSpotifyData(endpoint, accessToken, body).then(function (response) {
                resolve(response);
            }).catch(function (err) {
                reject(err);
            });
        });
    }; //end createPlaylist


    /**
     * 
     * @param accessToken
     */
    function getUserId(accessToken) {
        return new Promise(function (resolve, reject) {
            var endpoint = 'https://api.spotify.com/v1/me';
            spotify.getSpotifyQuery(endpoint, accessToken).then(function (result) {
                resolve(result.id);
            }).catch(function (err) {
                reject(err);
            });
        });
    }; //end getUserId


    /**
     * See https://developer.spotify.com/web-api/authorization-guide/#authorization-code-flow
     * @param req - HTTP Request Object
     * @param res - HTTP Response Object
     * @param code - User's authentication code
     */
    function getTokenWithCode(req, res, code) {
        return new Promise(function (resolve, reject) {
            //current token is still valid
            if (req.cookies && req.cookies.token && Date.now() < req.cookies.login_expire) {
                resolve(req.cookies.login_token);
            } else { //no token or expired
                var authOptions = getAuthOptions(req.cookies, code);

                request.post(authOptions, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        //save current access token, when it will expire,
                        //and another token to refresh it when it does expire
                        var access_token = body.access_token;
                        var expire = new Date(Date.now() + body.expires_in);
                        res.cookie('login_token', access_token);
                        res.cookie('login_refresh', body.refresh_token);
                        res.cookie('login_expire', expire);
                        resolve(access_token);
                    } else {
                        reject('Response from SpotifyAPIs: ' + response.statusMessage);
                    }
                });
            }
        }); //end Promise
    }; //end getTokenWithCode


    /**
     * Format POST request depending on if we have a valid token
     * Called by getTokenWithCode
     * @param cookies - Array of cookies
     */
    function getAuthOptions(cookies, code) {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            form: {
                redirect_uri: redirect_uri,
            },
            json: true
        };

        //use refresh token if exists, if not use authorization code
        if (cookies && cookies.refresh) {
            authOptions.form['grant_type'] = 'refresh_token';
            authOptions.form['refresh_token'] = cookies.login_refresh;
        } else {
            authOptions.form['grant_type'] = 'authorization_code';
            authOptions.form['code'] = (cookies && cookies.spotifyCode) ? cookies.spotifyCode : code;
        }
        return authOptions;
    } //end getAuthOptions


    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    function generateRandomString(length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }; //end generateRandomString
})();