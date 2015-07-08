'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    router = express.Router();

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
router.get('/:userId', authentication.authenticated, function (req, res, next) {

    var userId = req.params.userId || '';
    if (req.user._id === userId) {
        return sendUserInfo(userId, req, res, next);
    }

    authentication.authorized(req, res, function (err) {
        if (err) {
            return next(err);
        }

        sendUserInfo(userId, req, res, next);
    });
});

/* PUT: update a specific user's name. */
router.put('/:userId', authentication.authenticated, function (req, res, next) {

    var userId = req.params.userId || '';
    if (req.user._id === userId) {
        return updateUserInfo(userId, req, res, next);
    }

    authentication.authorized(req, res, function (err) {
        if (err) {
            return next(err);
        }

        updateUserInfo(userId, req, res, next);
    });
});

/* DELETE a specific user. */
router.delete('/:userId', authentication.authenticated, function (req, res, next) {

    var userId = req.params.userId || '';
    if (req.user._id === userId) {
        return deleteUser(userId, req, res, next);
    }

    authentication.authorized(req, res, function (err) {
        if (err) {
            return next(err);
        }

        deleteUser(userId, req, res, next);
    });
});

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
        name: {
            first: req.body.first || '',
            middle: req.body.middle || '',
            last: req.body.last || ''
        }
    };

    var options = {
        new: true
    }

    req.app.db.model('user').findOneAndUpdate(query, update, options, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            var err = new Error('No account with the given user id exists.');
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
            var err = new Error('No account with the given user id exists.');
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
            }
        });
    });
}

module.exports = router;
