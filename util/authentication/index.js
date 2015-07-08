'use strict';

var util = require('util');

exports = module.exports = {

    // Authentication middleware for passport
    authenticated: function (req, res, next) {

        if (req.isAuthenticated()) {
            return next();
        }

        var error = new Error('User not authenticated.');
        error.status = 401;
        next(error);
    },

    /**
     * Checks the authorization. Also checks if the user is authenticated
     *
     */
    authorized: function (req, res, next) {

        exports.authenticated(req, res, function(err){
                if(err){
                    return next(err)
                }

                var _userId = undefined,
                    _actions = undefined,
                    acl = req.app.acl,
                    resource,
                    url;

                if(req.user) {
                    _userId = req.user.username;
                }
                if(!_userId) {
                    err = new Error("'req.user.username' not found. Must be available after authentication.");
                    return next(err);
                }

                url = req.baseUrl + req.route.path.split('?')[0];

                if(url.length > 0 && url.charAt(url.length - 1) === '/') {
                    url = url.substring(0, url.length - 1);
                }
                resource = url;

                if (!_actions) {
                    _actions = req.method.toLowerCase();
                }

                acl.logger ? acl.logger.debug('Requesting ' + _actions + ' on ' + resource + ' by user ' + _userId) : null;

                acl.isAllowed(_userId, resource, _actions, function (err, allowed) {
                    if (err) {
                        next(err);
                    } else if (allowed === false) {
                        acl.logger ? acl.logger.debug('Not allowed ' + _actions + ' on ' + resource + ' by user ' + _userId) : null;
                        acl.allowedPermissions(_userId, resource, function (err, obj) {
                            acl.logger ? acl.logger.debug('Allowed permissions: ' + util.inspect(obj)) : null;
                        });
                        err = new Error('Insufficient permissions to access resource');
                        err.status = 403;
                        next(err);
                    } else {
                        acl.logger ? acl.logger.debug('Allowed ' + _actions + ' on ' + resource + ' by user ' + _userId) : null;
                        next();
                    }
                });

            });
    }
}
