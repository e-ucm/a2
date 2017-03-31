/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

exports = module.exports = function (app, callback) {

    // Generic debug logger for node_acl
    function logger() {
        return {
            debug: function (msg) {
                console.log('-DEBUG-ACL:', msg);
            }
        };
    }

    var Acl = require('acl');
    var acl = new Acl(new Acl.mongodbBackend(app.db.db, 'acl_'), app.get('env') === 'development' ? logger() : null);

    var admin = {
        name: 'admin',
        resources: [
            app.config.apiPath + '/applications',
            app.config.apiPath + '/applications/prefix/:prefix',
            app.config.apiPath + '/applications/:applicationId',
            app.config.apiPath + '/applications/look/:prefix',
            app.config.apiPath + '/users',
            app.config.apiPath + '/users/:userId',
            app.config.apiPath + '/users/:userId/verification',
            app.config.apiPath + '/users/:userId/roles',
            app.config.apiPath + '/users/:userId/roles/:roleName',
            app.config.apiPath + '/users/:userId/*/:permissionName',
            app.config.apiPath + '/roles',
            app.config.apiPath + '/roles/:roleName',
            app.config.apiPath + '/roles/:roleName/resources',
            app.config.apiPath + '/roles/:roleName/resources/*',
            app.config.apiPath + '/roles/:roleName/resources/*/permissions',
            app.config.apiPath + '/roles/:roleName/resources/*/permissions/:permissionName',
            app.config.apiPath + '/roles/:roleName/users',
            app.config.apiPath + '/signup/massive'
        ],
        permissions: '*'
    };

    if (!callback) {
        acl.allow(admin.name, admin.resources, admin.permissions);
    } else {
        acl.allow(admin.name, admin.resources, admin.permissions, callback);
    }

    /**
     * Return an array with all roles
     *
     */
    acl.listRoles = function (cb) {
        acl.backend.get(acl.options.buckets.meta, 'roles', function (err, result) {
            if (err) {
                cb(err);
            }

            cb(null, result);
        });
    };

    /**
     * Return a Error if the role doesn't exist
     */
    acl.existsRole = function (roleName, cb) {
        acl.listRoles(function (err, roles) {
            if (err) {
                return cb(err);
            }
            if (roles.indexOf(roleName) === -1) {
                err = new Error('The role ' + roleName + ' doesn\'t exist.');
                err.status = 400;
                return cb(err);
            }

            cb();
        });
    };

    app.acl = acl;
};
