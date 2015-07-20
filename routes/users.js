'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    router = express.Router(),
    userIdRoute = '/:userId',
    userIdRolesRoute = '/:userId/roles',
    unselectedFields = '-salt -hash -__v';

/**
 * @api {get} /users Returns all users.
 * @apiName GetUsers
 * @apiGroup Users
 *
 * @apiParam {String} [fields] The show fields separated by spaces
 * @apiParam {String} [sort=_id]
 * @apiParam {Number} [limit=20]
 * @apiParam {Number} [page=1]
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "fields": "field",
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
 *                 "roles" : ["admin"]
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

    req.app.db.model('user').pagedFind(query, fields, sort, limit, page, function (err, results) {

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
    checkAuthAndExec(req, res, next, sendUserInfo);
});

/**
 * @api {put} /users/:userId Changes the user name.
 * @apiName PutUser
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {Object} name User name.
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "name": {
 *              "first" : "Firstname",
 *              "middle" : Middlename",
  *              "last" : "Lastname
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
 *          "email": "admin@email.es",
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
    checkAuthAndExec(req, res, next, updateUserInfo);
});

/**
 * @api {delete} /users/:userId Removes the user.
 * @apiName DeleteUser
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
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
    checkAuthAndExec(req, res, next, deleteUser);
});

/**
 * @api {get} /users/:userId/roles Gets the user roles.
 * @apiName GetUsersRoles
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
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
    checkAuthAndExec(req, res, next, function (userId, req, res, next) {
        checkUserExistenceAndExec(req, res, next,
            sendUserRoles);
    });
});

/**
 * @api {post} /users/:userId/roles Creates new roles.
 * @apiName PostUserRole
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 * @apiParam {String[]} roles The new roles for the user.
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
    checkUserExistenceAndExec(req, res, next, addUserRoles);
});

/**
 * @api {delete} /users/:userId/roles Removes a role from the roles of an user.
 * @apiName DeleteUserRole
 * @apiGroup Users
 *
 * @apiParam {String} userId User id.
 *
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
    checkUserExistenceAndExec(req, res, next, removeUserRoles);
});

function checkAuthAndExec(req, res, next, execFunc) {
    var userId = req.params.userId || '';
    if (req.user._id === userId) {
        return execFunc(userId, req, res, next);
    }

    authentication.authorized(req, res, function (err) {
        if (err) {
            return next(err);
        }

        execFunc(userId, req, res, next);
    });
}

//User info.
function sendUserInfo(userId, req, res, next) {
    req.app.db.model('user').findById(userId).select(unselectedFields).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            err = new Error('No account with the given user id exists.');
            err.status = 400;
            return next(err);
        }
        res.json(user);
    });
}

function updateUserInfo(userId, req, res, next) {

    var query = {
        _id: userId
    };
    var update = {
        $set: {}
    };

    if (req.body.first) {
        update.$set["name.first"] = req.body.first;
    }
    if (req.body.middle) {
        update.$set["name.middle"] = req.body.middle;
    }
    if (req.body.last) {
        update.$set["name.last"] = req.body.last;
    }

    var options = {
        new: true
    };

    req.app.db.model('user').findOneAndUpdate(query, update, options).select(unselectedFields).exec(function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            err = new Error('No account with the given user id exists.');
            err.status = 400;
            return next(err);
        }
        res.json(user);
    });
}


function deleteUser(userId, req, res, next) {

    var query = {
        _id: userId
    };

    req.app.db.model('user').findOneAndRemove(query, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            err = new Error('No account with the given user id exists.');
            err.status = 400;
            return next(err);
        }

        var acl = req.app.acl;
        acl.userRoles(user.username, function (err, roles) {
            if (err) {
                return next(err);
            }

            if (roles && roles.length > 0) {
                acl.removeUserRoles(user.username, roles, function (err) {
                    if (err) {
                        return next(err);
                    }

                    res.sendDefaultSuccessMessage();
                });
            } else {
                res.sendDefaultSuccessMessage();
            }
        });
    });
}

// Roles

function checkUserExistenceAndExec(req, res, next, func) {
    var userId = req.params.userId || '';

    req.app.db.model('user').findById(userId, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            err = new Error('No account with the given user id exists.');
            err.status = 400;
            return next(err);
        }

        func(user, req, res, next);
    });
}

function sendUserRoles(user, req, res, next) {
    res.app.acl.userRoles(user.username, function (err, roles) {
        if (err) {
            return next(err);
        }

        if (!roles) {
            err = new Error('Something went wrong and the roles could not be retrieved');
            return next(err);
        }

        res.json(roles);
    });
}

function addUserRoles(user, req, res, next) {
    res.app.acl.addUserRoles(user.username, req.body, function (err) {
        if (err) {
            return next(err);
        }

        res.sendDefaultSuccessMessage();
    });
}

function removeUserRoles(user, req, res, next) {
    var toDelete = req.params.roleName;
    if (toDelete === 'admin') {
        if (req.user._id === user._id.toString()) {
            var err = new Error("You can't remove the 'admin' role from yourself.");
            err.status = 403;
            return next(err);
        }
    }
    res.app.acl.removeUserRoles(user.username, toDelete, function (err) {
        if (err) {
            return next(err);
        }

        res.sendDefaultSuccessMessage();
    });
}

module.exports = router;
