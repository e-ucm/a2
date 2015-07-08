'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    async = require('async'),
    router = express.Router();

/* GET roles. */
router.get('/', authentication.authorized, function (req, res, next) {

    req.app.acl.listRoles(function(err, roles){
        if(err){
            return next(err)
        }

        res.json(roles)
    })
});

/* POST roles, create a new role. */
router.post('/', authentication.authorized, function (req, res, next) {
    async.auto({
        validate: function (done) {
            if (!req.body.roles) {
                var error = new Error('Roles required!');
                error.status = 400;
                return done(error);
            }

            if (!req.body.allows && (!req.body.resources || !req.body.permissions)) {
                var error = new Error('Allows, or Resources and Permissions required!');
                error.status = 400;
                return done(error);
            }

            done();
        },
        addRole: ['validate', function (done) {
           if(req.body.allows){
               req.app.acl.allow([req.body], function(err, result){
                   done(err, result)
               });
           } else {
               req.app.acl.allow(req.body.roles, req.body.resources, req.body.permissions, function(err, result){
                   done(err, result)
               });
           }
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        res.json({
            message: 'Success'
        });
    });
});

/* GET permissions and resources of a role. */
router.get('/:roleName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    req.app.acl.whatResources(roleName, function(err, result){
        if (err){
            return next(err);
        }
        if(JSON.stringify(result)=="{}"){
            err = new Error("The role " + roleName + " doesn't exist.");
            err.status = 400;
            return next(err);
        }
        res.json(result)
    });
});

/* DELETE role. */
router.delete('/:roleName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    if(roleName === 'admin'){
        var err = new Error("The role " + roleName + " is indestructible");
        err.status = 403;
        return next(err);
    }

    req.app.acl.listRoles(function(err, roles){
        if(err){
            return next(err)
        }

        if(roles.indexOf(roleName) === -1){
            err = new Error("The role " + roleName + " doesn't exist.");
            err.status = 400;
            return next(err);
        }

        req.app.acl.removeRole(roleName, function(err){
            if (err){
                return next(err);
            }
            res.json({
                message: 'Success.'
            });
        });
    })
});

module.exports = router;