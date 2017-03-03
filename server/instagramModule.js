(function () {
    'use strict';
    /**
    * Modules
    */
    var express = require('express');
    var path = require('path');
    var app = express();
    var request = require('request');
    var querystring = require('querystring');
    var keys = require('./privateKeys');
    var cookieParser = require('cookie-parser');
    app.use(cookieParser());

    /** 
     * Public Functions
     */

    /**
     * Explicit OAuth 
     * See https://www.instagram.com/developer/authentication/ 
     */
    exports.instagramLogin = function (res) {
        res.redirect('https://api.instagram.com/oauth/authorize/?' +
            querystring.stringify({
                response_type: 'code',
                client_id: keys.instagram_client_id,
                redirect_uri: keys.instagram_redirect_uri,
                scope: 'public_content',
            })
        );
    }; //end instagramLogin


    /**
     *
     */
    exports.instagramSearch = function (artist, code, req, res) {
        //1: Exchange User Code for Access Token
        getTokenWithCode(req, res, code).then(function (token) {
            artist = artist.toLowerCase().replace(new RegExp(' ', 'g'), '');
            var endpoint = 'https://api.instagram.com/v1/tags/' + artist + '/media/recent?' +
                querystring.stringify({
                    access_token: token,
                    count: 15,
                    max_tag_id: 0,
                });
            //2: Search recent tags with value of artist
            getInstagramQuery(endpoint).then(function (body) {
                body = JSON.parse(body);
                console.log(body);
            }).catch(function (err) {

            });
        }).catch(function (err) {

        });
    }; //end instagramSearch


    /**
     * 
     * @param {string} endpoint - API URL
     */
    function getInstagramQuery(endpoint) {
        return new Promise(function (resolve, reject) {
            request.get(endpoint, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(body);
                }
                else {
                    reject('Response from Instagram: ' + response.statusMessage);
                }
            });
        });
    };


    /**
     * Use user's authentication code to get an access token
     * @param req - HTTP Request Object
     * @param res - HTTP Response Object
     * @param {string} code - Authentication code received when logging in
     */
    function getTokenWithCode(req, res, code) {
        return new Promise(function (resolve, reject) {
            //check if we already have a token
            if (req.cookies && req.cookies.instagram_token) {
                resolve(req.cookies.instagram_token);
            } else {
                var authOptions = getAuthOptions(code);

                request.post(authOptions, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        body = JSON.parse(body);
                        var token = body.access_token;
                        res.cookie('instagram_token', token);
                        resolve(token);
                    } else {
                        reject('Response from Instagram: ' + response.statusMessage);
                    }
                });
            }
        });
    }; //end getTokenWithCode
    exports.getTokenWithCode = getTokenWithCode;


    /**
     * 
     * @param {string} code - Authentication code received when logging in
     */
    function getAuthOptions(code) {
        return {
            url: 'https://api.instagram.com/oauth/access_token',
            form: {
                client_id: keys.instagram_client_id,
                client_secret: keys.instagram_client_secret,
                grant_type: 'authorization_code',
                redirect_uri: keys.instagram_redirect_uri,
                code: code,
            }
        };
    };

})(); //end closure