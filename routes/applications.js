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
    authentication = require('../util/authentication'),
    router = express.Router(),
    async = require('async'),
    applicationIdRoute = '/:applicationId',
    unselectedFields = '-__v',
    removeFields = ['__v'];

/**
 * @api {get} /applications Returns all the registered applications.
 * @apiName GetApplications
 * @apiGroup Applications
 *
 * @apiParam {String} [fields] The fields to be populated in the resulting objects.
 *                              An empty string will return the complete document.
 * @apiParam {String} [sort=_id] Place - before the field for a descending sort.
 * @apiParam {Number} [limit=20]
 * @apiParam {Number} [page=1]
 *
 * @apiPermission admin
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "fields": "",
 *          "sort": "name",
 *          "limit": 20,
 *          "page": 1
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "data": [
 *          {
 *              "_id": "559a447831b7acec185bf513",
 *              "name": "Gleaner App.",
 *              "prefix": "gleaner",
 *              "host": "localhost:3300",
 *              "anonymous": [],
 *              "timeCreated": "2015-07-06T09:03:52.636Z"
 *          }],
 *          "pages": {
 *              "current": 1,
 *              "prev": 0,
 *              "hasPrev": false,
 *              "next": 2,
 *              "hasNext": false,
 *              "total": 1
 *         },
 *          "items": {
 *              "limit": 20,
 *              "begin": 1,
 *              "end": 1,
 *              "total": 1
 *          }
 *      }
 *
 */
router.get('/', authentication.authorized, function (req, res, next) {

    var query = {};
    var fields = req.body.fields || '';
    var sort = req.body.sort || '_id';
    var limit = req.body.limit || 20;
    var page = req.body.page || 1;

    req.app.db.model('application').pagedFind(query, fields, removeFields, sort, limit, page, function (err, results) {

        if (err) {
            return next(err);
        }

        res.json(results);
    });
});

/**
 * @api {post} /applications Register a new application, if an application with the same prefix already exists it will be overridden with the new values.
 * @apiName postApplications
 * @apiGroup Applications
 *
 * @apiParam {String} prefix Application prefix.
 * @apiParam {String} host Application host.
 * @apiParam {String[]} anonymous Express-like routes for whom unidentified (anonymous) requests will be forwarded anyway.
 *
 * @apiPermission admin
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "prefix" : "gleaner",
 *          "host" : "localhost:3300"
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "prefix": "gleaner",
 *          "host": "localhost:3300",
 *          "anonymous": [],
 *          "timeCreated": "2015-07-06T09:03:52.636Z"
 *      }
 *
 * @apiError(400) PrefixRequired Prefix required!.
 *
 * @apiError(400) HostRequired Host required!.
 *
 */
router.post('/', authentication.authorized, function (req, res, next) {

    async.auto({
        validate: function (done) {
            var err;
            if (!req.body.prefix) {
                err = new Error('Prefix required!');
                return done(err);
            }

            if (!req.body.host) {
                err = new Error('Host required!');
                return done(err);
            }

            done();
        },
        roles: ['validate', function (done) {
            var rolesArray = req.body.roles;
            var routes = [];
            if (rolesArray) {
                rolesArray.forEach(function (role) {
                    role.allows.forEach(function (allow) {
                        var resources = allow.resources;
                        for (var i = 0; i < resources.length; i++) {
                            resources[i] = req.body.prefix + resources[i];
                            if (routes.indexOf(resources[i]) === -1) {
                                routes.push(resources[i]);
                            }
                        }
                    });
                });
                req.app.acl.allow(rolesArray, function (err) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, routes);
                });
            } else {
                done(null, routes);
            }
        }],
        application: ['roles', function (done, results) {
            var ApplicationModel = req.app.db.model('application');
            ApplicationModel.create({
                name: req.body.name || '',
                prefix: req.body.prefix,
                host: req.body.host,
                autoroles: req.body.autoroles,
                look: req.body.look || [],
                anonymous: req.body.anonymous || [],
                routes: results.roles,
                owner: req.user.username
            }, done);
        }]
    }, function (err, results) {
        if (err) {
            err.status = 400;
            return next(err);
        }

        var application = results.application;
        res.json(application);
    });
});


/**
 * @api {get} /applications/prefix/:prefix Gets the application information.
 * @apiName GetApplication
 * @apiGroup Applications
 *
 * @apiParam {String} applicationId Application id.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "name": "My App Name",
 *          "prefix": "gleaner",
 *          "host": "localhost:3300",
 *          "anonymous": [],
 *          "timeCreated": "2015-07-06T09:03:52.636Z"
 *      }
 *
 * @apiError(400) ApplicationNotFound No application with the given user id exists.
 *
 */
router.get('/prefix/:prefix', authentication.authorized, function (req, res, next) {
    req.app.db.model('application').findByPrefix(req.params.prefix).select(unselectedFields).exec(function (err, application) {
        if (err) {
            return next(err);
        }
        if (!application) {
            err = new Error('No application with the given application prefix exists.');
            err.status = 400;
            return next(err);
        }
        res.json(application);
    });
});

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * @api {get} /applications/:applicationId Gets the application information.
 * @apiName GetApplication
 * @apiGroup Applications
 *
 * @apiParam {String} applicationId Application id.
 *
 * @apiPermission admin
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "name": "My App Name",
 *          "prefix": "gleaner",
 *          "host": "localhost:3300",
 *          "anonymous": [],
 *          "timeCreated": "2015-07-06T09:03:52.636Z"
 *      }
 *
 * @apiError(400) ApplicationNotFound No application with the given user id exists.
 *
 */
router.get(applicationIdRoute, authentication.authorized, function (req, res, next) {
    var applicationId = req.params.applicationId || '';
    req.app.db.model('application').findById(applicationId).select(unselectedFields).exec(function (err, application) {
        if (err) {
            return next(err);
        }
        if (!application) {
            err = new Error('No application with the given application id exists.');
            err.status = 400;
            return next(err);
        }
        res.json(application);
    });
});

/**
 * @api {put} /applications/:applicationId Changes the application values.
 * @apiName PutApplication
 * @apiGroup Applications
 *
 * @apiParam {String} applicationId ApplicationId id.
 * @apiParam {String} name The new name.
 * @apiParam {String} prefix Application prefix.
 * @apiParam {String} host Application host.
 * @apiParam {String[]} anonymous Express-like routes for whom unidentified (anonymous) requests will be forwarded anyway.
 *                                      The routes from this array will be added only if they're not present yet.
 *
 * @apiPermission admin
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "name": "Gleaner App."
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "name": "Gleaner App.",
 *          "prefix": "gleaner",
 *          "host": "localhost:3300",
 *          "anonymous": [],
 *          "timeCreated": "2015-07-06T09:03:52.636Z"
 *      }
 *
 * @apiError(400) InvalidApplicationId You must provide a valid application id.
 *
 * @apiError(400) ApplicationNotFound No application with the given application id exists.
 *
 */
router.put(applicationIdRoute, authentication.authorized, function (req, res, next) {

    if (!req.params.applicationId) {
        var err = new Error('You must provide a valid application id');
        err.status = 400;
        return next(err);
    }

    var applicationId = req.params.applicationId || '';
    var query = {
        _id: applicationId,
        owner: req.user.username
    };
    var update = {
        $set: {}
    };

    if (req.body.name) {
        update.$set.name = req.body.name;
    }
    if (req.body.prefix) {
        update.$set.prefix = req.body.prefix;
    }
    if (req.body.host) {
        update.$set.host = req.body.host;
    }
    if (isArray(req.body.look)) {
        update.$addToSet = {look: {$each: req.body.look.filter(Boolean)}};
    }
    if (isArray(req.body.anonymous)) {
        update.$addToSet = {anonymous: {$each: req.body.anonymous.filter(Boolean)}};
    }

    var options = {
        new: true,
        /*
         Since Mongoose 4.0.0 we can run validators
         (e.g. isURL validator for the host attribute of ApplicationSchema --> /schema/application)
         when performing updates with the following option.
         More info. can be found here http://mongoosejs.com/docs/validation.html
         */
        runValidators: true
    };

    req.app.db.model('application').findOneAndUpdate(query, update, options).select(unselectedFields).exec(function (err, application) {
        if (err) {
            err.status = 403;
            return next(err);
        }
        if (!application) {
            err = new Error('No application with the given application id exists or ' +
                'you don\'t have permission to modify the given application.');
            err.status = 400;
            return next(err);
        }
        res.json(application);
    });
});

/**
 * @api {delete} /applications/:applicationId Removes the application.
 * @apiName DeleteApplication
 * @apiGroup Applications
 *
 * @apiParam {String} applicationId ApplicationId id.
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
 * @apiError(400) ApplicationNotFound No application with the given application id exists.
 *
 */
router.delete(applicationIdRoute, authentication.authorized, function (req, res, next) {

    var applicationId = req.params.applicationId || '';

    var query = {
        _id: applicationId,
        owner: req.user.username
    };

    req.app.db.model('application').findOneAndRemove(query, function (err, app) {
        if (err) {
            return next(err);
        }
        if (!app) {
            err = new Error('No application with the given application id exists.');
            err.status = 400;
            return next(err);
        }
        app.routes.forEach(function (route) {
            req.app.acl.removeResource(route);
        });

        res.sendDefaultSuccessMessage();
    });
});

/**
 * @api {put} /applications/look/:prefix Changes the application look field.
 * @apiName PutApplicationLook
 * @apiGroup Applications
 *
 * @apiParam {String} prefix Application prefix.
 *
 * @apiPermission admin
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "key":"_id",
 *          "user": "dev"
 *          "resources":["id1"],
 *          "methods":["post","put"],
 *          "url":"/url/*"
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "_id": "559a447831b7acec185bf513",
 *          "name": "Gleaner App.",
 *          "prefix": "gleaner",
 *          "host": "localhost:3300",
 *          "anonymous": [],
 *          "look":[{
 *              "key":"_id",
 *              "permissions":{
 *                 "dev":["id1","id2"]
 *               },
 *              "methods":["post","put"],
 *              "url":"/url/*"
 *          }],
 *          "timeCreated": "2015-07-06T09:03:52.636Z"
 *      }
 *
 * @apiError(400) InvalidApplicationId You must provide a valid application name.
 *
 * @apiError(400) ApplicationNotFound No application with the given application id exists.
 *
 */
router.put('/look/:prefix', authentication.authorized, function (req, res, next) {
    req.app.db.model('application').findByPrefix(req.params.prefix, function (err, results) {
        if (err) {
            return next(err);
        }

        var users = [];
        if (req.body.user) {
            users.push(req.body.user);
        }

        if (req.body.users) {
            users = users.concat(req.body.users);
        }

        var applicationId = results._id;
        var query = {
            _id: applicationId
        };

        var existKey = false;
        var addNewUser = [];
        var updateUser = [];
        var error;
        if (results.look) {
            results.look.forEach(function (lookObj) {
                if (lookObj.url === req.body.url) {
                    if (lookObj.key === req.body.key) {
                        if (lookObj.permissions) {
                            users.forEach(function(user) {
                                if (!lookObj.permissions[user]) {
                                    addNewUser.push(user);
                                }else {
                                    updateUser.push(user);
                                }
                            });
                        }
                        existKey = true;
                    } else {
                        error = new Error('URL registered but with a different key!');
                        error.status = 400;
                    }
                }
            });
        }

        if (error) {
            return next(error);
        }

        var update = {};
        if (!existKey) {
            var objToAdd = {
                key: req.body.key,
                permissions: {},
                methods: req.body.methods,
                url: req.body.url
            };

            users.forEach(function(user) {
                objToAdd.permissions[user] = req.body.resources;
            });

            update = {
                $push: {
                }
            };

            update.$push.look = objToAdd;
        } else {
            query['look.url'] = req.body.url;

            if (updateUser.length !== 0) {
                update.$addToSet = {};

                updateUser.forEach(function(user) {
                    var resultField = 'look.$.permissions.' + user;
                    update.$addToSet[resultField] = { $each:  req.body.resources };
                });
            }

            if (addNewUser.length !== 0) {
                update.$set = {};

                addNewUser.forEach(function(user) {
                    var updateProp = 'look.$.permissions.' + user;
                    update.$set[updateProp] = req.body.resources;
                });
            }
        }

        var options = {
            new: true,
            /*
             Since Mongoose 4.0.0 we can run validators
             (e.g. isURL validator for the host attribute of ApplicationSchema --> /schema/application)
             when performing updates with the following option.
             More info. can be found here http://mongoosejs.com/docs/validation.html
             */
            runValidators: true
        };

        req.app.db.model('application').findOneAndUpdate(query, update, options).select(unselectedFields).exec(function (err, application) {
            if (err) {
                err.status = 403;
                return next(err);
            }
            if (!application) {
                err = new Error('No application with the given application id exists or ' +
                    'you don\'t have permission to modify the given application.');
                err.status = 400;
                return next(err);
            }
            res.json(application.look);
        });
    });

});

module.exports = router;