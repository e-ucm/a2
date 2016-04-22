/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

        exports.authenticated(req, res, function (err) {
            if (err) {
                return next(err);
            }

            var _userId,
                _actions,
                acl = req.app.acl,
                resource,
                url;

            if (req.user) {
                _userId = req.user.username;
            }
            if (!_userId) {
                err = new Error('\'req.user.username\' not found. Must be available after authentication.');
                return next(err);
            }

            url = req.baseUrl + req.route.path.split('?')[0];

            if (url.length > 0 && url.charAt(url.length - 1) === '/') {
                url = url.substring(0, url.length - 1);
            }
            resource = url;

            if (!_actions) {
                _actions = req.method.toLowerCase();
            }

            if (acl.logger) {
                acl.logger.debug('Requesting ' + _actions + ' on ' + resource + ' by user ' + _userId);
            }

            acl.isAllowed(_userId, resource, _actions, function (err, allowed) {
                if (err) {
                    next(err);
                } else if (allowed === false) {
                    if (acl.logger) {
                        acl.logger.debug('Not allowed ' + _actions + ' on ' + resource + ' by user ' + _userId);
                    }
                    acl.allowedPermissions(_userId, resource, function (err, obj) {
                        if (acl.logger) {
                            acl.logger.debug('Allowed permissions: ' + util.inspect(obj));
                        }
                    });
                    err = new Error('Insufficient permissions to access resource');
                    err.status = 403;
                    next(err);
                } else {
                    if (acl.logger) {
                        acl.logger.debug('Allowed ' + _actions + ' on ' + resource + ' by user ' + _userId);
                    }
                    next();
                }
            });
        });
    }
};
