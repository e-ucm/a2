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
    async = require('async'),
    authentication = require('../util/authentication'),
    router = express.Router(),
    userIdRoute = '/:userId',
    userIdRolesRoute = '/:userId/roles',
    userIdExternalIdRoute = '/:userId/externalId',
    unselectedFields = '-salt -hash -__v',
    removeFields = ['salt', 'hash', '__v'];

/**
 * @api {get} /users Returns all users.
 * @apiName GetUsers
 * @apiGroup Users
 *
 * @apiParam {String} [fields] The fields to be populated in the resulting objects.
 *                              An empty string will return the complete document (Query param).
 * @apiParam {String} [sort=_id] Place - before the field for a descending sort (Query param).
 * @apiParam {Number} [limit=20] (Query param)
 * @apiParam {Number} [page=1] (Query param)
 *
 * @apiPermission admin
 *
 * @apiParamExample {json} Request-Example:
 *      api/users?limit=1&page=1
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "data": [
 *          {
 *              "_id": "559a447831b7acec185bf513",
 *              "username": "admin",
 *              "email": "admin@email.es",
 *              "timeCreated": "2015-07-06T09:03:52.636Z",
 *              "verification": {
 *                  "complete": false
 *              },
 *              "name": {
 *                  "last": "",
 *                  "middle": "",
 *                  "first": ""
 *              },
 *              "roles" : ["admin"]
 *          }],
 *          "pages": {
 *              "current": 1,
 *              "prev": 0,
 *              "hasPrev": false,
 *              "next": 2,
 *              "hasNext": true,
 *              "total": 3
 *         },
 *          "items": {
 *              "limit": 5,
 *              "begin": 1,
 *              "end": 3
 *              "total": 3
 *          }
 *      }
 *
 */
router.get('/', authentication.authorized, function (req, res, next) {

    var query = {};
    var fields = req.query.fields || '';
    var sort = req.query.sort || '_id';
    var limit = req.query.limit || 20;
    var page = req.query.page || 1;

    req.app.db.model('user').pagedFind(query, fields, removeFields, sort, limit, page, function (err, results) {

        if (err) {
            return next(err);
        }

        res.json(results);
    });
});

/**
 * @api {get} /users/:userId Gets the user information.
 * @apiName GetUser
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 *
 * @apiPermission none
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "username": "admin",
 *          "email": "admin@email.es",
 *          "timeCreated": "2015-07-06T09:03:52.636Z",
 *          "verification": {
 *             "complete": false
 *          },
 *          "name": {
 *              "last": "",
 *              "middle": "",
 *              "first": ""
 *          }
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.get(userIdRoute, authentication.authenticated, function (req, res, next) {
    async.auto({
        checkAuth: function (done) {
            checkAuthAndExec(req, res, done);
        },
        getInfo: ['checkAuth', function (done, results) {
            getUserInfo(results.checkAuth, req, res, done);
        }]
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.getInfo);
    });
});

/**
 * @api {get} /users/external/:domain/:externalId Gets the user information using externalId
 * @apiName GetUsersExternal
 * @apiGroup Users
 *
 * @apiParam {String} domain External domain
 * @apiParam {String} externalId External ID
 *
 * @apiPermission none
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "username": "admin",
 *          "email": "admin@email.es",
 *          "timeCreated": "2015-07-06T09:03:52.636Z",
 *          "verification": {
 *             "complete": false
 *          },
 *          "name": {
 *              "last": "",
 *              "middle": "",
 *              "first": ""
 *          }
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.get('/external/:domain/:externalId', authentication.authenticated, function (req, res, next) {
    var domain = req.params.domain;
    var externalId = req.params.externalId;

    if(!domain){
        res.status(400);
        return res.json({message: 'Invalid domain'});
    }

    if(!externalId){
        res.status(400);
        return res.json({message: 'Invalid externalId'});
    }

    req.app.db.model('user')
        .findOne({ externalId: { $elemMatch: { domain: domain, id: externalId } } }, function (err, user) {
            if (err) {
                return next(err);
            }

            if(!user){
                res.status(404);
                return res.json({message: 'User ('+externalId+') not found for domain '+domain});
            }

            res.json(user);
        });
});

/**
 * @api {put} /users/:userId Changes the user name and/or email.
 * @apiName PutUser
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {[String]} email User email.
 * @apiParam {[Object]} name User name.
 *
 * @apiPermission none
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "email" : "your@email.com",
 *          "name": {
 *              "first" : "Firstname",
 *              "middle" : "Middlename",
  *              "last" : "Lastname"
 *          }
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "username": "admin",
 *          "email": "your@email.com",
 *          "timeCreated": "2015-07-06T09:03:52.636Z",
 *          "verification": {
 *             "complete": false
 *          },
 *          "name": {
 *              "last": "Firstname",
 *              "middle": "Middlename",
 *              "first": "Lastname"
 *          },
 *              "roles" : ["admin"]
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.put(userIdRoute, authentication.authenticated, function (req, res, next) {
    async.auto({
        checkAuth: function (done) {
            checkAuthAndExec(req, res, done);
        },
        put: ['checkAuth', function (done, results) {
            updateUserInfo(results.checkAuth, req, res, done);
        }]
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.put);
    });
});

/**
 * @api {put} /users/:userId/password Changes the user password.
 * @apiName PutUser
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {String} oldPassword.
 * @apiParam {String} newPassword.
 *
 * @apiPermission none
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "password" : "old_pass",
 *          "newPassword": "new_pass"
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "username": "userId",
 *          "email": "your@email.com",
 *          "name": {
 *              "last": "Firstname",
 *              "middle": "Middlename",
 *              "first": "Lastname"
 *          },
 *              "roles" : ["user"]
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.put(userIdRoute + '/password', authentication.authenticated, function (req, res, next) {
    async.auto({
        getUser: function (done) {
            if (!req.body.password || !req.body.newPassword) {
                var err = new Error('Bad request, you need the current password and the new password');
                err.status = 400;
                return done(err);
            }
            req.app.db.model('user').findById(req.params.userId, function (err, user) {
                if (err) {
                    err = new Error('The user with ' + req.params.userId + ' id doesn\'t exist');
                    err.status = 404;
                    return done(err);
                }
                done(null, user);
            });
        },
        checkOldPassword: ['getUser', function (done, results) {
            req.body.username = results.getUser.username;
            req.app.passport.authenticate('local', {session: false}, function (err, user, info) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    err = new Error(info.message);
                    err.status = 401;
                    return done(err);
                }
                done();
            })(req, res, next);
        }],
        putPassword: ['checkOldPassword', function (done, results) {
            results.getUser.setPassword(req.body.newPassword, function (err, user) {
                if (err) {
                    return done(err);
                }
                user.save(function (err, result) {
                    if (err) {
                        return done(err);
                    }

                    done(null, result);
                });
            });

        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        res.json({message: 'Success'});
    });
});

/**
 * @api {delete} /users/:userId Removes the user.
 * @apiName DeleteUser
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 *
 * @apiPermission none
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.delete(userIdRoute, authentication.authenticated, function (req, res, next) {
    async.auto({
        checkAuth: function (done) {
            checkAuthAndExec(req, res, done);
        },
        deleteUser: ['checkAuth', function (done, results) {
            deleteUser(results.checkAuth, req, res, done);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        res.sendDefaultSuccessMessage();
    });
});

/**
 * @api {get} /users/:userId/roles Gets the user roles.
 * @apiName GetUsersRoles
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 *
 * @apiPermission none
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "Role1",
 *          "Role2"
 *      ]
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.get(userIdRolesRoute, authentication.authenticated, function (req, res, next) {
    async.auto({
        checkAuth: function (done) {
            checkAuthAndExec(req, res, done);
        },
        checkUser: ['checkAuth', function (done) {
            checkUserExistenceAndExec(req, res, done);
        }],
        getRoles: ['checkUser', function (done, results) {
            getUserRoles(results.checkUser, req, res, done);
        }]
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.getRoles);
    });
});

/**
 * @api {post} /users/:userId/roles Added a role to user.
 * @apiName PostUserRole
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {String[]} roles The new roles for the user.
 *
 * @apiPermission admin
 *
 * @apiParamExample {json} Request-Example:
 *      [
 *          "Role1",
 *          "Role2"
 *      ]
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.post(userIdRolesRoute, authentication.authorized, function (req, res, next) {
    async.auto({
        checkUser: function (done) {
            checkUserExistenceAndExec(req, res, done);
        },
        checkRoles: ['checkUser', function (done) {
            req.body.forEach(function (role) {
                req.app.acl.existsRole(role, function (err) {
                    if (err) {
                        return done(err);
                    }
                });
            });
            done();
        }],
        addRoles: ['checkRoles', function (done, results) {
            addUserRoles(results.checkUser, req, res, done);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        res.sendDefaultSuccessMessage();
    });
});

/**
 * @api {delete} /users/:userId/roles Removes a role from the roles of an user.
 * @apiName DeleteUserRole
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.delete(userIdRolesRoute + '/:roleName', authentication.authorized, function (req, res, next) {
    async.auto({
        checkUser: function (done) {
            checkUserExistenceAndExec(req, res, done);
        },
        deleteRoles: ['checkUser', function (done, results) {
            removeUserRoles(results.checkUser, req, res, done);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        res.sendDefaultSuccessMessage();
    });
});

/**
 * @api {post} /users/:userId/externalId Adds externalId to user.
 * @apiName PostUserexternalId
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {Object[]} externalId The new externalId for the user.
 *
 * @apiPermission admin
 *
 * @apiParamExample {json} Request-Example:
 *      [
 *          { "domain" : "Domain1", "externalId" : "id1" },
 *          { "domain" : "Domain2", "externalId" : "id2" }
 *      ]
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.post(userIdExternalIdRoute, function (req, res, next) {
    var user;
    var externalId = req.body.externalId;

    async.auto({
        checkUser: function (done) {
            checkUserExistenceAndExec(req, res, done);
        },
        checkexternalId: ['checkUser', function (done, results) {
            user = results.checkUser;

            for (var i = 0; i < externalId.length; i++) {
                for (var j = 0; j < user.externalId.length; j++) {
                    if (externalId[i].domain === user.externalId[j].domain) {
                        delete user.externalId[j];
                        user.externalId.splice(j, 1);
                        j--;
                    }
                }
            }

            user.save(function(error, result) {
                for (var i = 0; i < externalId.length; i++) {
                    user.externalId.push({
                        domain: externalId[i].domain,
                        id: externalId[i].id
                    });
                }

                user.save(done);
            });
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        res.sendDefaultSuccessMessage();
    });
});

/**
 * @api {delete} /users/:userId/externalId/:domain Removes a externalId from the externalId of an user.
 * @apiName DeleteUserExternalId
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {String} domain ExternalId domain.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 * @apiError(403) UserNotFound No account with the given user id exists.
 *
 */
router.delete(userIdExternalIdRoute + '/:domain', function (req, res, next) {
    var domain = req.params.domain;
    var user;

    if (!domain) {
        res.status(400);
        return res.json({message: 'Not valid domain'});
    }

    async.auto({
        checkUser: function (done) {
            checkUserExistenceAndExec(req, res, done);
        },
        deleteExternalId: ['checkUser', function (done, results) {
            user = results.checkUser;

            for (var i = 0; i < user.externalId.length; i++) {
                if (user.externalId[i].domain === domain) {
                    delete user.externalId[i];
                    user.externalId.splice(i, 1);
                    console.log('deleted');
                    break;
                }
            }

            console.log(user);

            user.save(done);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        res.sendDefaultSuccessMessage();
    });
});

/**
 * @api {get} /users/:userId/:resourceName/:permissionName Returns true if the user has the permission for the resource. Otherwise returns false.
 * @apiName UserAllow
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {String} resourceName Resource name.
 * @apiParam {String} permissionName Permission name.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      true
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.get(userIdRoute + '/*/:permissionName', authentication.authorized, function (req, res, next) {
    async.auto({
        checkUser: function (done) {
            checkUserExistenceAndExec(req, res, done);
        },
        allow: ['checkUser', function (done, results) {
            isAllowed(results.checkUser, req, res, done);
        }]
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.allow);
    });
});

/**
 * @api {post} /users/:userId/verification Send email to verify the user authenticity.
 * @apiName VerificationMail
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 *
 * @apiPermission none
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(400) UserNotFound No account with the given user id exists.
 *
 */
router.post(userIdRoute + '/verification', authentication.authorized, function (req, res, next) {
    async.auto({
        checkUser: function (done) {
            checkUserExistenceAndExec(req, res, done);
        },
        getInfo: ['checkUser', function (done, results) {
            getUserInfo(results.checkUser, req, res, done);
        }],
        generateToken: function (done) {
            require('crypto').randomBytes(20, function (err, buf) {
                var token;
                if (!err) {
                    token = buf.toString('hex');
                }
                done(err, token);
            });
        },
        saveToken: ['generateToken', 'getInfo', function (done, results) {

            var user = results.getInfo;

            user.verification.token = results.generateToken.toString();
            user.save(done);

        }],
        sendMail: ['saveToken', function (done, results) {
            req.app.utility.sendmail(req, res, {
                from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
                to: results.getInfo.email,
                subject: req.app.config.projectName + ' verification mail',
                textPath: 'verification/email-text',
                htmlPath: 'verification/email-html',
                locals: {
                    link: req.headers.host + '/users/:userId/verification/' + results.generateToken,
                    projectName: req.app.config.projectName
                },
                email: results.getInfo.email,
                projectName: req.app.config.projectName,
                success: function () {
                    res.sendDefaultSuccessMessage();
                    done();
                },
                error: function (err) {
                    done(err);
                }
            });
        }]
    }, function (err) {
        if (err) {
            next(err);
        }
    });
});

/**
 * @api {post} /users/:userId/verification/:token Verify the user email.
 * @apiName Verification
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {String} token Verification token.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) {String} Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(401) InvalidToken Password reset token is invalid or has expired.
 *
 */
router.post(userIdRoute + '/verification/:token', function (req, res, next) {

    req.app.db.model('user').findOne({
        'verification.token': req.params.token.toString()
    }, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            err = new Error('Verification token is invalid.');
            err.status = 401;
            return next(err);
        }

        user.verification.token = undefined;
        user.verification.complete = true;
        user.save(function (err) {
            if (err) {
                return next(err);
            }
            res.sendDefaultSuccessMessage();
        });
    });
});

function checkAuthAndExec(req, res, cb) {
    var userId = req.params.userId || '';
    if (req.user._id === userId) {
        return cb(null, userId);
    }

    authentication.authorized(req, res, function (err) {
        if (err) {
            return cb(err);
        }

        cb(null, userId);
    });
}

// User info.
function getUserInfo(userId, req, res, cb) {
    req.app.db.model('user').findById(userId).select(unselectedFields).exec(function (err, user) {
        if (err) {
            return cb(err);
        }
        if (!user) {
            err = new Error('No account with the given user id exists.');
            err.status = 400;
            return cb(err);
        }
        cb(null, user);
    });
}

function updateUserInfo(userId, req, res, cb) {

    var query = {
        _id: userId
    };
    var update = {
        $set: {}
    };

    if (req.body.email) {
        update.$set.email = req.body.email;
    }
    if (req.body.name) {
        if (req.body.name.first) {
            update.$set['name.first'] = req.body.name.first;
        }
        if (req.body.name.middle) {
            update.$set['name.middle'] = req.body.name.middle;
        }
        if (req.body.name.last) {
            update.$set['name.last'] = req.body.name.last;
        }
    }

    var options = {
        new: true,
        /*
         Since Mongoose 4.00.0 we can run validators when performing updates
         (e.g. isEmail validator for the email attribute of UserSchema -> /schema/user)
         when performing updates with the following option.
         More info. can be found here http://mongoosejs.com/docs/validation.html
         */
        runValidators: true
    };

    req.app.db.model('user').findOneAndUpdate(query, update, options).select(unselectedFields).exec(function (err, user) {
        if (err) {
            err.status = 403;
            return cb(err);
        }
        if (!user) {
            err = new Error('No account with the given user id exists.');
            err.status = 400;
            return cb(err);
        }
        cb(null, user);
    });
}

function deleteUser(userId, req, res, cb) {

    var query = {
        _id: userId
    };

    req.app.db.model('user').findOneAndRemove(query, function (err, user) {
        if (err) {
            return cb(err);
        }
        if (!user) {
            err = new Error('No account with the given user id exists.');
            err.status = 400;
            return cb(err);
        }

        var acl = req.app.acl;
        acl.userRoles(user.username, function (err, roles) {
            if (err) {
                return cb(err);
            }

            if (roles && roles.length > 0) {
                acl.removeUserRoles(user.username, roles, function (err) {
                    if (err) {
                        return cb(err);
                    }

                    cb();
                });
            } else {
                cb();
            }
        });
    });
}

// Roles

function checkUserExistenceAndExec(req, res, cb) {
    var userId = req.params.userId || '';

    req.app.db.model('user').findById(userId, function (err, user) {
        if (err) {
            return cb(err);
        }
        if (!user) {
            err = new Error('No account with the given user id exists.');
            err.status = 400;
            return cb(err);
        }

        cb(null, user);
    });
}

function getUserRoles(user, req, res, cb) {
    res.app.acl.userRoles(user.username, function (err, roles) {
        if (err) {
            return cb(err);
        }

        if (!roles) {
            err = new Error('Something went wrong and the roles could not be retrieved');
            return cb(err);
        }

        cb(null, roles);
    });
}

function addUserRoles(user, req, res, cb) {
    res.app.acl.addUserRoles(user.username, req.body, function (err) {
        if (err) {
            return cb(err);
        }

        cb();
    });
}

function removeUserRoles(user, req, res, cb) {
    var toDelete = req.params.roleName;
    if (toDelete === 'admin') {
        if (req.user._id === user._id.toString()) {
            var err = new Error('You can\'t remove the \'admin\' role from yourself.');
            err.status = 403;
            return cb(err);
        }
    }
    res.app.acl.removeUserRoles(user.username, toDelete, function (err) {
        if (err) {
            return cb(err);
        }

        cb();
    });
}

function isAllowed(user, req, res, cb) {
    res.app.acl.isAllowed(user.username, req.params[0], req.params.permissionName, function (err, result) {
        if (err) {
            return cb(err);
        }

        cb(null, result);
    });
}

module.exports = router;
