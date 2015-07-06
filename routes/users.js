'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    router = express.Router();

/* GET users listing. */
router.get('/', authentication.authorized(), function (req, res, next) {

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

/* GET a specific user. */
router.get('/:userId', authentication.authenticated, function (req, res, next) {
    var userId = req.params.userId || '';
    if(req.user._id === userId) {
       return sendUserInfo(userId, req, res, next);
    }
    authentication.authorized()(req, res, function (err) {
        if (err) {
            return next(err);
        }

        sendUserInfo(userId, req, res, next);
    });
});


module.exports = router;
