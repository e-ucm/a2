/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    async = require('async'),
    request = require('request');
var OAuth2Strategy = require('passport-oauth2').Strategy;

/**
 * Default redirect value, if not specified.
 *  When specified as a 'callback' query key this value is replaced.
 *
 *  This value is used to issue a callback to the initiator of the process with the
 *  data usefull for the login (username, email, access control token).
 * @type {string}
 */
var callback = 'https://localhost:3000/api/proxy/afront/loginbyplugin';

/**
 * The 'plugin id'. Unique identifier of the plugin that is used to identify it.
 * It's used to set up the route of this plugin, e.g. '/login/pluginId' -> (pluginId = samlnl) -> '/login/samlnl'
 *
 * @type {string}
 */
var pluginId = 'beaconing';

/**
 * Plugin name.
 * @type {string}
 */
var pluginName = 'beaconing';

/**
 * Information for the passport configuration.
 * @type {{path: string, entryPoint: string, issuer: string}}
 */

var passport = {
    // ?response_type=code&client_id=some_client_id_here&redirect_uri=some_callback_url_here
    baseURL: 'https://core.beaconing.eu/',
    authorizationURL: 'https://core.beaconing.eu/auth/auth',
    tokenURL: 'https://core.beaconing.eu/auth/token',
    clientID: 'analytics',
    clientSecret: 'IVzeBVKpPriNYbM3O4Dr4El01R9zTBkNsgrAahvoiu7f51oUws3ISIAJOkBhlzuA',
    callbackURL: '',
    partialURL: '/api/login/beaconing/callback'
};

function oauthSetup(app) {

    var getUrl = function(req){
        return req.protocol + '://' + req.get('host');
    };
    
    var hasKey = function(array, key){
        var has = false;

        for (var i = array.length - 1; i >= 0; i--) {
            if(array[i].domain === key){
                has = true;
                break;
            }
        }

        return has;
    };

    var checkUser = function(accessToken, refreshToken, profile, done) {
        console.log(profile);

        userExists(profile, app.db, function (err, user) {
            if (err) {
                // No user found, create a new user and assign a new role
                console.info(err);
                return addNewUser(profile, app.db, app.acl, done);
            }

            var userRoles = function(){
                app.acl.userRoles(user.username.toString(), function (err, roles) {
                    if (err) {
                        return done(err);
                    }
                    user.roles = roles;
                    done(null, user);
                });
            };

            if(!hasKey(user.externalId, "beaconing")){
                user.externalId.push({beaconing: profile.id});
                user.save(function(error, result){
                    userRoles();
                });
            }else{
                userRoles();
            }
        });
    };

    var setupPassport = function(passport){
        var client = new OAuth2Strategy(passport, checkUser);
        client.userProfile = userProfile;

        app.passport.use(client);
        return client;
    };

    setupPassport(passport);

    var userProfile = function (accesstoken, done) {
        // choose your own adventure, or use the Strategy's oauth client
        request({
            uri: passport.baseURL + "api/currentuser",
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accesstoken
            }
        }, function (err, httpResponse, body) {
            if (err || (httpResponse && httpResponse.statusCode !== 200)) {
                return done(err);
            }
            body = JSON.parse(body);

            done(null, body);
        });
    };

    app.passport.serializeUser(function(user, done) {
        done(null, user);
    });

    app.passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    var generateEmail = function(profile){
        return profile.id + profile.username  + '@beaconing.eu';
    };

    var userExists = function (profile, db, callback) {

        db.model('user').findOne({email: generateEmail(profile)}, function (err, user) {
            if (err) {
                return callback(err);
            }

            if (!user) {
                err = new Error('No account with that email address exists.');
                err.status = 400;
                return callback(err);
            }

            callback(null, user);
        });
    };

    var addNewUser = function (profile, db, acl, callback) {
        var UserModel = db.model('user');
        var user = new UserModel({
            username: profile.username,
            email: generateEmail(profile),
            timeCreated: new Date(),
            verification: {
                complete: true
            }
        });

        user.save(function (saveErr) {
            if (saveErr) {
                return callback(saveErr);
            }

            // Default role assigned to the user
            var roles = profile.roles;
            acl.addUserRoles(user.username.toString(), roles, function (err) {
                if (err) {
                    return callback(err);
                }
                if (typeof roles === 'string' || roles instanceof String) {
                    user.roles = [roles];
                } else {
                    user.roles = roles;
                }
                callback(null, user);
            });
        });
    };

    router.get('/beaconing', function (req, res, next) {
            passport.callbackURL = getUrl(req) + passport.partialURL;
            setupPassport(passport);

            if (req.query.callback) {
                callback = req.query.callback;
            }
            next();
        },
        app.passport.authenticate('oauth2')
    );

    router.post('/beaconing', function (req, res) {
        passport.callbackURL = getUrl(req) + passport.partialURL;
        setupPassport(passport);

        if(!req.body.accessToken){
            res.status(400);
            return res.json({message: 'Missing accessToken in body'});
        }

        userProfile(req.body.accessToken, function(error, profile){
            if(error){
                res.status(500);
                return res.json({message: 'Unable to obtain user profile'});
            }
            checkUser(null, null, profile, function(err, user){
                if(err){
                    res.status(500);
                    return res.json(err);
                }
                generateAccessToken(req, user, function(e, accesstoken){
                    res.json({_id: user._id, username: user.username, email: user.email, token: accesstoken, roles: user.roles});
                });
            });
        });
    });

    router.get('/beaconing/callback', function (req, res, next) {
        req.app.passport.authenticate('oauth2', 
            { failureRedirect: '/login', session: false}, function (err, user, info) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    err = new Error(info.message);
                    err.status = 401;
                    return next(err);
                }
                req.logIn(user, {session: false}, function (err) {
                    if (err) {
                        return next(err);
                    }

                    generateAccessToken(req, user, function(error, token){
                        if(error){
                            return next(error);
                        }

                        var base = callback;
                        var id = encodeURIComponent(user._id);
                        var username = encodeURIComponent(user.username);
                        var email = encodeURIComponent(user.email);
                        var tokenValue = encodeURIComponent(token);
                        var url = base + '?id=' + id + '&username=' + username + '&email=' + email + '&token=' + tokenValue;

                        if (user.roles) {
                            if (typeof user.roles === 'string' || user.roles instanceof String) {
                                url += '&roles=' + user.roles;
                            } else {
                                var roles = encodeURIComponent(user.roles[0]);
                                url += '&roles=' + roles;
                            }
                        }

                        res.redirect(url);
                    });
                });

            })(req, res, next);
    });

    var generateAccessToken = function(req, user, cb){
        async.waterfall([
            /*Generate a random number*/
            function (done) {
                require('crypto').randomBytes(10, function (err, buf) {
                    if (err) {
                        return done(err);
                    }
                    var randNum = buf.toString('hex');
                    done(null, randNum);
                });
            },
            /*Generate the token*/
            function (randNum, done) {
                var data = {
                    _id: user._id,
                    randNum: randNum
                };

                var expirationInSec = req.app.config.tokenExpirationInSeconds;
                var token = jwt.sign(data, req.app.config.cryptoKey, {
                    expiresIn: expirationInSec
                });

                req.app.tokenStorage.save(token, {
                    username: user.username
                }, expirationInSec, done);
            }
        ], function (error, result) {
            cb(error, result);
        });
    };

    return {
        router: router,
        name: pluginName,
        pluginId: pluginId
    };
}

module.exports = oauthSetup;