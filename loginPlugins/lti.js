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
    passport = require('passport'),
    LtiStr = require('passport-lti').Strategy,
    lti = require('ims-lti'),
    mongoose = require('mongoose'),
    request = require('request');

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
 */

function ltiSetup(app) {

    var userSchema = new mongoose.Schema({
        key: {
            type: String,
            unique: true,
            required: true
        },
        secret: {
            type: String,
            unique: true,
            required: true
        }
    });

    userSchema.set('autoIndex', true);
    app.db.model('ltiStore', userSchema);

    var strategy = new LtiStr({
        createProvider: function (req, done) {
            // Lookup your LTI customer in your DB with req's params, and get its secret
            // Dummy DB lookup
            var host = req.hostname;
            if(host.indexOf('localhost') !== -1) {
                host += ':' + app.config.port;
            }
            var launchURL = '';
            if(process.env.LTI_BACK_HOST && process.env.LTI_BACK_PORT){
                var launchProtocol =  process.env.LTI_BACK_PROTOCOL ? process.env.LTI_BACK_PROTOCOL : 'http';
                launchURL = launchProtocol + '://'+ process.env.LTI_BACK_HOST + ':' + process.env.LTI_BACK_PORT +
                    '/api/lti/key/' + req.body.oauth_consumer_key;
            } else {
                launchURL = req.protocol + '://' + host + '/api/proxy/' + req.params.prefixbd +
                    '/lti/key/' + req.body.oauth_consumer_key;
            }
            request.get(launchURL, function(err, response, body) {
                if (err) {
                    return done(err);
                }
                body = JSON.parse(body);
                if (body) {
                    var consumer = new lti.Provider(body._id, body.secret);
                    return done(null, consumer);
                } else {
                    // String error, will fail the strategy (and not crash it)
                    return done('Not Authorized');
                }
            });
        }
    }, function(lti, done) {

        userExists(lti, app.db, function (err, user) {
            if (err) {
                // No user found, create a new user and assign a new role
                return addNewUser(lti, app.db, app.acl, done);
            }
            app.acl.userRoles(user.username.toString(), function (err, roles) {
                if (err) {
                    return done(err);
                }
                user.roles = roles;
                done(null, user);
            });
        });

    });

    /**
     * Define a new 'lti' passport Strategy
     */
    app.db.model('ltiStore').create({
        id: 'key',
        key: 'key',
        secret: 'secret'
    }, function() {
        passport.use('lti', strategy);
    });

    /** The profile given by lti have the next format
     * <code>
     * {
     *      user_id: '2',
     *      lis_person_sourcedid: '',
     *      roles: [ 'Instructor' ],
     *      context_id: '2',
     *      context_label: 't1',
     *      context_title: 'test1',
     *      resource_link_title: 'Rage',
     *      resource_link_description: '',
     *      resource_link_id: '2',
     *      context_type: 'CourseSection',
     *      lis_course_section_sourcedid: '',
     *      lis_result_sourcedid: '{"data":{"instanceid":"2","userid":"2","typeid":null,"launchid":605290586},
     *      "hash":"a7267de5cef1e823e96b129ceed1237613g218cb67353b1dd39714ea8e47eadf"}',
     *      lis_outcome_service_url: 'http://localhost/mod/lti/service.php',
     *      lis_person_name_given: 'Luis',
     *      lis_person_name_family: 'Hernandez',
     *      lis_person_name_full: 'Luis Hernandez',
     *      ext_user_username: 'lnandez',
     *      lis_person_contact_email_primary: 'lnandez@email.es',
     *      launch_presentation_locale: 'en',
     *      ext_lms: 'moodle-2',
     *      tool_consumer_info_product_family_code: 'moodle',
     *      tool_consumer_info_version: '2016092900',
     *      lti_version: 'LTI-1p0',
     *      lti_message_type: 'basic-lti-launch-request',
     *      tool_consumer_instance_guid: 'localhost',
     *      tool_consumer_instance_name: '',
     *      tool_consumer_instance_description: '',
     *      launch_presentation_document_target: 'iframe',
     *      launch_presentation_return_url: 'http://localhost/mod/lti/return.php?course=2&launch_container=3&instanceid=2&sesskey=XnhopytJPw' }

     * </code>
     */

    /**
     * Ensure that the user exists, given a parsed LTI profile.
     *
     * @param profile
     * @param db
     * @param callback
     */
    var userExists = function (profile, db, callback) {
        db.model('user').findOne({email: profile.lis_person_contact_email_primary}, function (err, user) {
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
     * Note: Usernames have to be unique. You should use the same logic to check whether
     * a LTI-Authenticated user exists and here to create that user. This avoids finding
     * that a "new" user has an existing username.
     *
     * @param profile
     * @param db
     * @param acl
     * @param callback
     */
    var addNewUser = function (profile, db, acl, callback) {
        var UserModel = db.model('user');
        var user = new UserModel({
            username: profile.lis_person_contact_email_primary,
            email: profile.lis_person_contact_email_primary,
            name: {
                first: profile.lis_person_name_full,
                last: profile.lis_person_name_family
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
                callback(null, user);
            });
        });
    };

    /**
     * @param profile
     * @returns {string} a role given a user has already logged in (authenticated) so that we can
     *  take care of the 'authorization' layer. Taken from 'eduPersonAffiliation' attribute of the 'profile' object.
     */
    var getUserRoles = function (profile) {

        var rolesArray = profile.roles;

        if (rolesArray) {
            // Possible values:
            // Learner, Instructor, TeachingAssistant, ContentDeveloper, NonCreditLearner and User
            if (rolesArray.indexOf('Instructor') !== -1) {
                return 'teacher';
            }
        }

        // By default return the 'lowest' role available
        return 'student';
    };

    /**
     * Route to start the 'lti' login process
     */
    router.post('/launch/:prefix/:prefixbd', function (req, res, next) {
        async.auto({
            auth: function (done) {
                app.passport.authenticate('lti',
                    {session: false}, function (err, user, info) {
                        if (err) {
                            return done(err);
                        }
                        if (!user) {
                            err = new Error(info.message);
                            err.status = 401;
                            return done(err);
                        }
                        done(null, user);
                    })(req, res, next);
            },
            randomNumb: ['auth', function (done, results) {
                require('crypto').randomBytes(10, function (err, buf) {
                    if (err) {
                        return done(err);
                    }
                    var randNum = buf.toString('hex');
                    done(null, randNum);
                });
            }],
            generateToken: ['randomNumb', function (done, results) {
                var data = {
                    _id: results.auth._id,
                    randNum: results.randNum
                };

                var expirationInSec = app.config.tokenExpirationInSeconds;
                var token = jwt.sign(data, app.config.cryptoKey, {
                    expiresIn: expirationInSec
                });

                app.tokenStorage.save(token, {
                    username: results.auth.username
                }, expirationInSec, function() {
                    done(null, token);
                });
            }],
            sendData: ['generateToken', function (done, results) {
                var id = encodeURIComponent(results.auth._id);
                var username = encodeURIComponent(results.auth.username);
                var email = encodeURIComponent(results.auth.email);
                var tokenValue = encodeURIComponent(results.generateToken);

                var url = '?id=' + id + '&username=' + username + '&email=' + email + '&token=' + tokenValue + '&redirect=' + req.body.oauth_consumer_key;

                if (results.auth.roles) {
                    if (typeof results.auth.roles === 'string' || results.auth.roles instanceof String) {
                        url += '&roles=' + results.auth.roles;
                    } else {
                        var roles = encodeURIComponent(results.auth.roles[0]);
                        url += '&roles=' + roles;
                    }
                }
                done(null, url);
            }]
        }, function (err, results) {
            if (err) {
                err.status = 400;
                return next(err);
            }

            var url = req.protocol + '://' + req.hostname + '/api/proxy/' + req.params.prefix + '/loginbyplugin' + results.sendData;
            res.redirect(url);
        });
    });

    return {
        router: router,
        name: 'LTI',
        pluginId: 'lti'
    };
}

module.exports = ltiSetup;
