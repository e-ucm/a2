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
 * @api {post} /applications Register a new application.
 * @apiName postApplications
 * @apiGroup Applications
 *
 * @apiParam {String} prefix Application prefix.
 * @apiParam {String} host Application host.
 * @apiParam {Array<String>} anonymous Express-like routes for whom unidentified (anonymous) requests will be forwarded anyway.
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
                            routes.push(resources[i]);
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
                anonymous: req.body.anonymous || [],
                routes: results.roles
            }, done);
        }],
    }, function (err, results) {
        if (err) {
            err.status = 400;
            return next(err);
        }

        var application = results.application;
        res.json({
            _id: application._id,
            prefix: application.prefix,
            host: application.host,
            timeCreated: application.timeCreated,
            anonymous: application.anonymous
        });
    });
});

/**
 * @api {get} /applications/:applicationId Gets the application information.
 * @apiName GetApplication
 * @apiGroup Applications
 *
 * @apiParam {String} applicationId ApplicationId id.
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

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * @api {put} /applications/:applicationId Changes the application name.
 * @apiName PutApplication
 * @apiGroup Applications
 *
 * @apiParam {String} applicationId ApplicationId id.
 * @apiParam {String} name The new name.
 * @apiParam {String} prefix Application prefix.
 * @apiParam {String} host Application host.
 * @apiParam {Array<String>} anonymous Express-like routes for whom unidentified (anonymous) requests will be forwarded anyway.
 *                                      The routes from this array will be added only if they're not present yet.
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
        _id: applicationId
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
    if(isArray(req.body.anonymous)) {
        update.$addToSet = { anonymous: { $each: req.body.anonymous.filter(Boolean) } };
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
            err = new Error('No application with the given application id exists.');
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
        _id: applicationId
    };

    req.app.db.model('application').findOneAndRemove(query, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            err = new Error('No application with the given application id exists.');
            err.status = 400;
            return next(err);
        }

        res.sendDefaultSuccessMessage();
    });
});

module.exports = router;