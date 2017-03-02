(function () {
    'use strict';
    /**
     * Modules
     */
    var express = require('express');
    var app = express();
    var keys = require('./privateKeys');
    var request = require('request');
    var querystring = require('querystring');
    var cookieParser = require('cookie-parser');
    app.use(cookieParser());

    /**
     * Private Properties
     */
    var stateKey = 'spotify_auth_state';
    var client_id = keys.spotify_client_id; // Your client id
    var redirect_uri = keys.spotify_redirect_uri; // Your redirect uri
    var client_secret = keys.spotify_client_secret; // Your secret

    /**
     * Public Functions
     */
    exports.spotifyLogin = function (res) {
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
    };

    exports.savePlaylist = function (req, res, code, playlist) {
        return new Promise(function (resolve, reject) {
            //1: Get access token
            getAccessToken(req, res, code).then(function (accessToken) {
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

    /* Private Functions*/
    function addPlaylistSongs(userId, accessToken, playlistId, songs) {
        return new Promise(function (resolve, reject) {
            var body = {
                uris: [],
            }
            songs.forEach(function (song) {
                body.uris.push(song.uri);
            });

            var endpoint = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks';
            postSpotifyData(endpoint, accessToken, body).then(function (response) {
                resolve(response.snapshot_id);
            }).catch(function (err) {
                reject(err);
            });
        });
    }; //end addSongs


    function createPlaylist(userId, accessToken, playlistTitle) {
        return new Promise(function (resolve, reject) {
            var body = {
                name: playlistTitle,
                public: false
            }
            var endpoint = 'https://api.spotify.com/v1/users/' + userId + '/playlists';
            postSpotifyData(endpoint, accessToken, body).then(function (response) {
                resolve(response);
            }).catch(function (err) {
                reject(err);
            });
        });
    }; //end createPlaylist


    function getUserId(accessToken) {
        return new Promise(function (resolve, reject) {
            var endpoint = 'https://api.spotify.com/v1/me';
            getSpotifyQuery(endpoint, accessToken).then(function (result) {
                resolve(result.id);
            }).catch(function (err) {
                reject(err);
            });
        });
    }

    function getAccessToken(req, res, code) {
        // Gets an access token for Spotify's Web APIs
        // See https://developer.spotify.com/web-api/authorization-guide/#client-credentials-flow

        return new Promise(function (resolve, reject) {
            //current token is still valid
            if (req.cookies && req.cookies.token && Date.now() < req.cookies.login_expire) {
                resolve(req.cookies.login_token);
            }
            //no token or expired
            else {
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
                    }
                    else {
                        reject('Response from SpotifyAPIs: ' + response.statusMessage);
                    }
                });
            }
        }); //end Promise
    }; //end getAccessToken

    /**
     * Format POST request depending on if we have a valid token
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
        }
        else {
            authOptions.form['grant_type'] = 'authorization_code';
            authOptions.form['code'] = (cookies && cookies.code) ? cookies.code : code ;
        }
        return authOptions;
    }

    function getSpotifyQuery(endpoint, accessToken) {
        return new Promise(function (resolve, reject) {
            var options = {
                url: endpoint,
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                },
                json: true
            };
            request.get(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(body);
                }
                else {
                    reject('Response from SpotifyAPIs: ' + response.statusMessage);
                }
            });
        });
    };

    function postSpotifyData(endpoint, accessToken, body) {
        return new Promise(function (resolve, reject) {
            var options = {
                url: endpoint,
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                },
                body: body,
                json: true
            };
            request.post(options, function (error, response, body) {
                if (!error && response.statusCode == 201) {
                    resolve(body);
                }
                else {
                    reject('Response from SpotifyAPIs: ' + response.statusMessage);
                }
            });
        });
    }

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
    };
})();