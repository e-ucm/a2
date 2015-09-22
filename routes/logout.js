'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    router = express.Router();

/**
 * @api {delete} /logout LogOut the user.
 * @apiName Logout
 * @apiGroup Logout
 *
 * @apiPermission none
 *
 * @apiSuccess(200) {String} Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 */
router.delete('/', authentication.authenticated, function (req, res) {
    req.logout();
    req.app.tokenStorage.delete(req);
    res.sendDefaultSuccessMessage();
});

module.exports = router;