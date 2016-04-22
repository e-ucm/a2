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
    async = require('async');

/**
 * @api {post} /signup Sign Up a new user.
 * @apiName Signup
 * @apiGroup Signup
 *
 * @apiParam {String} email User email.
 * @apiParam {String[]} username User username.
 * @apiParam {String[]} password User password
 *
 * @apiPermission none
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "email" : "user@email.com",
 *          "username" : "user",
 *          "password" : "pass",
 *          "role" : "roleName",
 *          "prefix": "applicationName"
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "user": {
 *              "_id": "558bf50db06537ec2225beb5",
 *              "username": "user",
 *              "email": "user@email.com"
 *          }
 *      }
 *
 * @apiError(400) UsernameRequired Username required!.
 *
 * @apiError(400) PasswordRequired Password required!.
 *
 * @apiError(400) EmailRequired Email required!.
 *
 */
router.post('/', function (req, res, next) {

    async.auto({
        validate: function (done) {
            var err;
            if (!req.body.username) {
                err = new Error('Username required!');
                err.status = 400;
                return done(err);
            }

            if (!req.body.password) {
                err = new Error('Password required!');
                err.status = 400;
                return done(err);
            }

            if (!req.body.email) {
                err = new Error('Email required!');
                err.status = 400;
                return done(err);
            }

            if (req.body.role && !req.body.prefix) {
                err = new Error('Application prefix required');
                err.status = 400;
                return done(err);
            }

            if (req.body.role === 'admin') {
                err = new Error('The admin role can\'t be assigned');
                err.status = 403;
                return done(err);
            }

            if (req.body.role && req.body.prefix) {
                req.app.acl.existsRole(req.body.role, function (err) {
                    if (err) {
                        err = new Error('The role ' + req.body.role + ' doesn\'t exist');
                        err.status = 404;
                        return done(err);
                    }
                    var AppModel = req.app.db.model('application');
                    AppModel.findByPrefix(req.body.prefix, function (err, application) {
                        if (err) {
                            return done(err);
                        }
                        if (!application) {
                            err = new Error('The ' + req.body.prefix + ' doesn\'t exist');
                            err.status = 404;
                            return done(err);
                        }
                        if (application.autoroles.indexOf(req.body.role) === -1) {
                            err = new Error('The ' + req.body.role + ' role can\'t be assigned');
                            err.status = 403;
                            return done(err);
                        }
                        return done();
                    });


                });
            } else {
                done();
            }

        },
        user: ['validate', function (done) {
            var UserModel = req.app.db.model('user');
            UserModel.register(new UserModel({
                username: req.body.username,
                email: req.body.email,
                timeCreated: new Date(),
                verification: {
                    complete: false
                }
            }), req.body.password, function (err, resultUser) {
                if (err) {
                    if (err.errors) {
                        if (err.errors.email && err.errors.email.message) {
                            err.message = err.errors.email.message;
                        }
                        if (err.errors.username && err.errors.username.message) {
                            err.message = err.errors.username.message;
                        }
                    }
                    return done(err);
                }
                if (req.body.role && req.body.prefix) {
                    res.app.acl.addUserRoles(req.body.username, req.body.role, function (err) {
                        if (err) {
                            return done(err);
                        }

                        done(null, resultUser);
                    });
                } else {
                    done(null, resultUser);
                }
            });
        }],
        welcome: ['user', function (done, results) {

            var user = results.user;

            req.app.utility.sendmail(req, res, {
                from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
                to: req.body.email,
                subject: req.app.config.projectName + ' signup',
                textPath: 'signup/email-text',
                htmlPath: 'signup/email-html',
                locals: {
                    username: user.username,
                    email: req.body.email,
                    projectName: req.app.config.projectName
                },
                name: req.body.name,
                email: req.body.email,
                projectName: req.app.config.projectName,
                success: function () {
                    console.log('Email sent with success!');
                },
                error: function (err) {
                    console.warn('sending welcome email failed:', err);
                }
            });

            done();
        }]
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        var user = results.user;
        res.json({
            user: {
                _id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

module.exports = router;