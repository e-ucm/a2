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
    async = require('async');
var SamlStrategy = require('passport-saml').Strategy;

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
var pluginId = 'samlnl';

/**
 * Plugin name.
 * @type {string}
 */
var pluginName = 'SAML';

/**
 * Information for the passport configuration.
 * @type {{path: string, entryPoint: string, issuer: string}}
 */
var passport = {
    path: process.env.SAML_PATH || 'api/login/saml/callback',
    entryPoint: process.env.SAML_ENTRY_POINT || '',
    issuer: process.env.SAML_ISSUER || ''
};


/**
 * THIS IS A LOGIN PLUGIN FILE.
 *
 * This file serves as an example for further login plugins that want to be implemented.
 *
 * The key aspects of a login plugin file are:
 *
 *      - The module must export a function that receives the 'app' as its first argument (the name of the function it doesn't matter).
 *      - The 'app' object has access to useful functions such as
 *          - 'app.passport': https://github.com/jaredhanson/passport, useful for defining new login strategies
 *          - 'app.config': with the project configuration file (config.js), useful to access configuration constants
 *      - The 'require' modules that can be included in this file must be available at 'package.json' file of this project, e.g.
 *
 *          "dependencies": {
 *              "acl": "0.4.9",
 *              "async": "^1.3.x",
 *              "bcrypt": "^0.8.x"...
 *          },
 *          "devDependencies": {
 *              "apidoc": "*",
 *              "assert": "*",
 *              "confidence": "*"...
 *          }
 */

function samlSetup(app) {

    /**
     * Define a new 'saml' passport Strategy
     */

    app.passport.use(pluginId, new SamlStrategy(
            {
                path: passport.path,
                entryPoint: passport.entryPoint,
                issuer: passport.issuer
            },
            function (profile, done) {
                // The SAML process has finished and we have received a 'profile' object
                // Check if the 'profile' user already exists in our database.
                userExists(profile, app.db, function (err, user) {
                    if (err) {
                        // No user found, create a new user and assign a new role
                        return addNewUser(profile, app.db, app.acl, done);
                    }
                    app.acl.userRoles(user.username.toString(), function (err, roles) {
                        if (err) {
                            return done(err);
                        }
                        user.roles = roles;
                        done(null, user);
                    });
                });
            })
    );

    /**
     * Ensure that the user exists, given a parsed SAML profile.
     *
     *
     * @param profile
     * <code>
     *         {
     *
     *             issuer: 'www.stichtingpraktijkl...',
     *             sessionIndex: '_6f3c53f02c954...',
     *             nameID: '_75ed2719953d90d...',
     *             nameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
     *             nameQualifier: undefined,
     *             spNameQualifier: 'example.local.e-ucm.es:3000',
     *             spl_idp_host: 'www.stichtingpraktijkl...',
     *             spl_id: '00000145760',
     *             nlEduPersonTussenvoegsels: undefined,
     *             nlEduPersonHomeOrganization: 'e-UCM Research Group',
     *             spl_forbidden_url: 'https://www.stichtingpraktijkl...',
     *             nlEduPersonProfileId: 'email...',
     *             uid: '2d1b51e8024c11b11bb1a68...',
     *             givenName: 'Dan',
     *             sn: 'Cristian',,
     *             eduPersonAffiliation: [ 'student', 'member' ],
     *             mail: 'email...',
     *             email: 'email...'
     *         }
     * </code>
     */
    var userExists = function (profile, db, callback) {
        db.model('user').findOne({email: profile.email}, function (err, user) {
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

    /**
     * Invoked when a new user from the IdP was not found in our database.
     * Should create a new user with the priviliged required.
     *
     * @param profile
     * @param profile
     * <code>
     *         {
     *
     *             issuer: 'www.stichtingpraktijkl...',
     *             sessionIndex: '_6f3c53f02c954...',
     *             nameID: '_75ed2719953d90d...',
     *             nameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
     *             nameQualifier: undefined,
     *             spNameQualifier: 'example.local.e-ucm.es:3000',
     *             spl_idp_host: 'www.stichtingpraktijkl...',
     *             spl_id: '00000145760',
     *             nlEduPersonTussenvoegsels: undefined,
     *             nlEduPersonHomeOrganization: 'e-UCM Research Group',
     *             spl_forbidden_url: 'https://www.stichtingpraktijkl...',
     *             nlEduPersonProfileId: 'email...',
     *             uid: '2d1b51e8024c11b11bb1a68...',
     *             givenName: 'Dan',
     *             sn: 'Cristian',,
     *             eduPersonAffiliation: [ 'student', 'member' ],
     *             mail: 'email...',
     *             email: 'email...'
     *         }
     * </code>
     *
     * Note: Usernames have to be unique. You should use the same logic to check whether
     * a SAML-Authenticated user exists and here to create that user. This avoids finding
     * that a "new" user has an existing username.
     *
     * @param db
     */
    var addNewUser = function (profile, db, acl, callback) {
        var UserModel = db.model('user');
        var user = new UserModel({
            username: profile.email,
            email: profile.email,
            name: {
                first: profile.givenName,
                last: profile.sn

            },
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
            var roles = getUserRoles(profile);
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

    /**
     * @param profile
     * <code>
     *         {
     *
     *             issuer: 'www.stichtingpraktijkl...',
     *             sessionIndex: '_6f3c53f02c954...',
     *             nameID: '_75ed2719953d90d...',
     *             nameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
     *             nameQualifier: undefined,
     *             spNameQualifier: 'example.local.e-ucm.es:3000',
     *             spl_idp_host: 'www.stichtingpraktijkl...',
     *             spl_id: '00000145760',
     *             nlEduPersonTussenvoegsels: undefined,
     *             nlEduPersonHomeOrganization: 'e-UCM Research Group',
     *             spl_forbidden_url: 'https://www.stichtingpraktijkl...',
     *             nlEduPersonProfileId: 'email...',
     *             uid: '2d1b51e8024c11b11bb1a68...',
     *             givenName: 'Dan',
     *             sn: 'Cristian',,
     *             eduPersonAffiliation: [ 'student', 'member' ],
     *             mail: 'email...',
     *             email: 'email...'
     *         }
     * </code>
     * @returns {string} a role given a user has already logged in (authenticated) so that we can
     *  take care of the 'authorization' layer. Taken from 'eduPersonAffiliation' attribute of the 'profile' object.
     */
    var getUserRoles = function (profile) {

        var rolesArray = profile.eduPersonAffiliation;

        if (rolesArray) {
            // Possible values:
            // Student, member, staff, faculty and employee
            // Student and employee need ne explanation
            // Faculty is for roles with educational responsibility (teachers)
            // Staff is for roles without educational responsibility (non-teachers).
            // Hybrid roles have both staff and faculty
            if (rolesArray.indexOf('faculty') !== -1) {
                return 'teacher';
            }

            if (rolesArray.indexOf('student') !== -1) {
                return 'student';
            }

            if (rolesArray.indexOf('member') !== -1) {
                return 'student';
            }

            if (rolesArray.indexOf('staff') !== -1) {
                return 'student';
            }

            if (rolesArray.indexOf('employee') !== -1) {
                return 'student';
            }
        }

        // By default return the 'lowest' role available
        return 'student';
    };

    /**
     * Route to start the 'saml' login process
     */
    router.get('/' + pluginId, function (req, res, next) {
            if (req.query.callback) {
                callback = req.query.callback;
            }
            next();
        },
        app.passport.authenticate(pluginId, {failureRedirect: '/', failureFlash: true}),
        function (req, res) {
            res.redirect('/');
        }
    );

    /**
     * @api {post} /login/saml LogIn the user using SAML, callback invoked when SAML login process finished successfully.
     * @apiName Login
     * @apiGroup Login
     *
     * @apiPermission none
     *
     * @apiSuccess(200) {String} Success.
     *
     * @apiSuccessExample Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "user": {
     *              "_id": "559a447831b7acec185bf513",
     *              "username": "root",
     *              "email": "yourmail@ucm.es",
     *              "roles" : ["admin"],
     *              "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIU..."
     *          }
     *      }
     *
     * @apiError(401) UserNotFound User not found.
     */
    router.post('/saml/callback', function (req, res, next) {
        req.app.passport.authenticate(pluginId,
            {session: false}, function (err, user, info) {
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
                        },
                        /*Send the login data*/
                        function (token, done) {

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
                            done();
                        }
                    ], function (err) {
                        if (err) {
                            return next(err);
                        }
                    });
                });

            })(req, res, next);
    });

    return {
        router: router,
        name: pluginName,
        pluginId: pluginId
    };
}

module.exports = samlSetup;