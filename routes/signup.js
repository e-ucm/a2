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
    async = require('async'),
    multer = require('multer'),
    fs = require('fs');

var storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, file.filename + '-' + Date.now());
    }
});

var decode = multer({storage: storage}).single('csv');

var addUsersArray = function(req, res, next, users) {
    var usersError = [];
    async.each(users.users, function(userObject, callback) {
        async.auto({
            validate: function(done) {
                validateUser(req, userObject, false, function(err) {
                    if (err) {
                        usersError.push('>> ' + userObject.username + ' << ' + err);
                    }
                    done();
                });
            }, user: ['validate', function (done) {
                registerUser(req, res, userObject, function(err) {
                    if (err) {
                        usersError.push('>> ' + userObject.username + '<< ' + err);
                    }
                    done();
                });
            }]
        }, function () {
            callback();
        });
    }, function(err) {
        var msn = 'Users registered';
        var errors = [];
        if (usersError.length > 0) {
            msn += ' but there are some problems' + ' \n ';
            usersError.forEach(function(e) {
                errors.push(e);
            });
        }
        res.json({msn: msn, errors: errors, errorCount: errors.length});

    });
};

var validateUser = function (req, userObject, forcePass, done) {
    var err;
    if (!userObject.username) {
        err = new Error('Username required!');
        err.status = 400;
        return done(err);
    }

    userObject.username = userObject.username.toLowerCase();

    if (!userObject.password) {
        if (forcePass) {
            err = new Error('Password required!');
            err.status = 400;
            return done(err);
        } else { // Generate random alphanumeric password (8 characters)
            userObject.password = Math.random().toString(36).substr(2, 8);
        }
    }

    if (!userObject.email) {
        err = new Error('Email required!');
        err.status = 400;
        return done(err);
    }

    if (userObject.role && !userObject.prefix) {
        err = new Error('Application prefix required');
        err.status = 400;
        return done(err);
    }

    if (userObject.role === 'admin') {
        err = new Error('The admin role can\'t be assigned');
        err.status = 403;
        return done(err);
    }

    if (userObject.role && userObject.prefix) {
        req.app.acl.existsRole(userObject.role, function (err) {
            if (err) {
                err = new Error('The role ' + userObject.role + ' doesn\'t exist');
                err.status = 404;
                return done(err);
            }
            var AppModel = req.app.db.model('application');
            AppModel.findByPrefix(userObject.prefix, function (err, application) {
                if (err) {
                    return done(err);
                }
                if (!application) {
                    err = new Error('The ' + userObject.prefix + ' doesn\'t exist');
                    err.status = 404;
                    return done(err);
                }
                if (application.autoroles.indexOf(userObject.role) === -1) {
                    err = new Error('The ' + userObject.role + ' role can\'t be assigned');
                    err.status = 403;
                    return done(err);
                }
                return done();
            });


        });
    } else {
        done();
    }
};

var registerUser = function(req, res, userObject, done) {
    var UserModel = req.app.db.model('user');
    UserModel.register(new UserModel({
        username: userObject.username,
        email: userObject.email,
        timeCreated: new Date(),
        verification: {
            complete: false
        }
    }), userObject.password, function (err, resultUser) {
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

        if (userObject.role && userObject.prefix) {
            res.app.acl.addUserRoles(userObject.username, userObject.role, function (err) {
                if (err) {
                    return done(err);
                }

                done(null, resultUser);
            });
        } else {
            done(null, resultUser);
        }
    });
};

var parseUsersCSV = function (req, res, next, path, callback) {
    fs.readFile(path, 'utf8', function (err,csv) {
        if (err) {
            return next(err);
        }
        var usersObjects = {users: []};
        var lines = csv.split(/[\n\r]/g);
        var heads = lines[0];
        var data = lines.slice(1, lines.length);
        var head = heads.split(',');
        data.forEach(function(line) {
            if (line !== '') {
                var words = line.split(',');
                var obj = {};
                var i = 0;
                head.forEach(function (h) {
                    obj[h] = words[i];
                    i++;
                });
                usersObjects.users.push(obj);
            }
        });
        callback(req, res, next, usersObjects);
    });
};

/**
 * @api {post} /signup Sign Up an user.
 * @apiName Signup
 * @apiGroup Signup
 *
 * @apiParam {String} email User email.
 * @apiParam {String} username User username.
 * @apiParam {String} password User password
 * @apiParam {String} role Possible role considering roles have been established with A2 for 'prefix'
 * @apiParam {String} prefix Application prefix that has different roles that can be registered with
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
 * "user": {
 *      "_id": "58d246c4ec32372c316d11aa",
 *      "username": "user",
 *      "email": "user@email.com",
 *      "role": "roleName",
 *      "prefix": "applicationName"
 * }
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
        validate: function(done) {
            validateUser(req, req.body, true, done);
        }, user: ['validate', function (done) {
            registerUser(req, res, req.body, done);
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

/**
 * @api {post} /signup/massive Sign Up a group of users.
 * @apiName Signup
 * @apiGroup Signup
 *
 * @apiParam {String[]} users Users array
 *
 * @apiPermission none
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "users": [{
 *              "username": "user1",
 *              "password": "user1Pass",
 *              "email": "user1@mail.es"
 *          },
 *          {
 *              "username": "user3",
 *              "password": "user3Pass",
 *              "email": "user3@mail.es",
 *              "role" : "roleName",
 *              "prefix": "applicationName"
 *          },
 *          {
 *              "username": "user2",
 *              "password": "user2Pass",
 *              "email": "user2@mail.es"
 *          }]
 *  }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *           "msn": "Users registered",
 *           "errors": [],
 *           "errorCount": 0
 *      }
 *
 * @apiError(400) UsersRequired The body need a json with users field.
 *
 * @apiError(400) UsersArrayRequired The users field has to be a not empty array.
 *
 */
router.post('/massive/', function (req, res, next) {
    var users = req.body;
    decode(req, res, function(err) {
        if (req.file) {
            users = parseUsersCSV(req, res, next, req.file.path, addUsersArray);
        } else {
            if (!users.users) {
                err = new Error('The body needs a json with users field');
                err.status = 400;
                next(err);
                return;
            } else if (!Array.isArray(users.users) || users.users.length === 0) {
                err = new Error('The users field has to be a not empty array');
                err.status = 400;
                next(err);
                return;
            }
            addUsersArray(req, res, next, users);
        }
    });
});

module.exports = router;