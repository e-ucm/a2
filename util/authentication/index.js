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
     *
     * @param numPathComponents for the time when you can't consider the whole url as the resource.
     *  For instance, if the URL is the following:
     *
     *      '/blogs/:id/comments/:commentId'
     *
     *  and you want to ignore the last parameter ':commentId', you pass numPathComponents argument as 3
     *
     *      accessControl(3)
     *
     *  In this case the resource will be just the three first components of the url (without the ending slash).
     *
     */
    authorized: function (numPathComponents) {

        return function (req, res, next) {
            var _userId = undefined,
                _actions = undefined,
                acl = req.app.acl,
                resource,
                url;
            if(req.user) {
                _userId = req.user.username;
            }
            if (!_userId) {
                var error = new Error('User not authenticated.');
                error.status = 401;
                next(error);
                return;
            }

            url = req.baseUrl + req.route.path.split('?')[0];
            if (!numPathComponents) {
                if(url.length > 0 && url.charAt(url.length - 1) === '/') {
                    url = url.substring(0, url.length - 1);
                }
                resource = url;
            } else {
                resource = url.split('/').slice(0, numPathComponents + 1).join('/');
            }

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
        };
    }
}
