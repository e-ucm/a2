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

/* GET a specific user. */
router.get('/:userId', authentication.authorized(), function (req, res, next) {
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
        res.json(user);
    });
});


module.exports = router;
