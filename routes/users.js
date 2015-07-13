'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    router = express.Router(),
    userIdRoute = '/:userId',
    userIdRolesRoute = '/:userId/roles';

/* GET users listing. */
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

/* GET a specific user. */
router.get(userIdRoute, authentication.authenticated, function (req, res, next) {
    checkAuthAndExec(req, res, next, sendUserInfo);
});

/* PUT: update a specific user's name. */
router.put(userIdRoute, authentication.authenticated, function (req, res, next) {
    checkAuthAndExec(req, res, next, updateUserInfo);
});

/* DELETE a specific user. */
router.delete(userIdRoute, authentication.authenticated, function (req, res, next) {
    checkAuthAndExec(req, res, next, deleteUser);
});

/* GET a specific user's roles. */
router.get(userIdRolesRoute, authentication.authenticated, function (req, res, next) {
    checkAuthAndExec(req, res, next, function (userId, req, res, next) {
        checkUserExistenceAndExec(req, res, next,
            sendUserRoles);
    });
});

/* POST roles to an user. */
router.post(userIdRolesRoute, authentication.authorized, function (req, res, next) {
    checkUserExistenceAndExec(req, res, next, addUserRoles);
});

/* DELETE user's roles. */
router.delete(userIdRolesRoute, authentication.authorized, function (req, res, next) {
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
    req.app.db.model('user').findById(userId, function (err, user) {
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

    req.app.db.model('user').findOneAndUpdate(query, update, options, function (err, user) {
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

                    res.json({
                        message: 'Success.'
                    });
                });
            } else {
                res.json({
                    message: 'Success.'
                });
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

        res.json({
            message: 'Success.'
        });
    });
}

function removeUserRoles(user, req, res, next) {
    var toDelete = req.body;
    if ((Array.isArray(toDelete) && toDelete.indexOf('admin') != -1)) {
        if (req.params.userId === user._id.toString()) {
            var err = new Error("You can't remove the 'admin' role from yourself.");
            err.status = 403;
            return next(err);
        }
    }
    res.app.acl.removeUserRoles(user.username, req.body, function (err) {
        if (err) {
            return next(err);
        }

        res.json({
            message: 'Success.'
        });
    });
}

module.exports = router;
