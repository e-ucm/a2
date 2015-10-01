'use strict';

var express = require('express'),
    router = express.Router();

/**
 * @api {get} /health Check the api health.
 * @apiName Heath
 * @apiGroup Health
 *
 * @apiPermission none
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "status": "available"
 *      }
 */
router.get('/', function (req, res, next) {
    res.json({
        status: 'available'
    });
});

module.exports = router;