'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    router = express.Router();

/* GET roles. */
router.get('/', authentication.authorized(), function (req, res, next) {

    req.app.acl.listRoles(function(err, roles){
        if(err){
            return next(err)
        }

        res.send(roles)
    })
});




module.exports = router;