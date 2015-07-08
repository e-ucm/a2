'use strict';

exports = module.exports = function (app) {

    // Generic debug logger for node_acl
    function logger() {
        return {
            debug: function (msg) {
                console.log('-DEBUG-ACL:', msg);
            }
        };
    }

    var acl = require('acl');
    var acl = new acl(new acl.mongodbBackend(app.db.db, 'acl_'), logger());

    var roles = [
        {
            name: 'admin',
            resources: [
                app.config.apiPath + '/users',
                app.config.apiPath + '/users/:userId',
                app.config.apiPath + '/roles',
                app.config.apiPath + '/roles/:roleName',
                app.config.apiPath + '/roles/:roleName/resources',
                app.config.apiPath + '/roles/:roleName/resources/:resourceName',
                app.config.apiPath + '/roles/:roleName/resources/:resourceName/permissions',
                app.config.apiPath + '/roles/:roleName/resources/:resourceName/permissions/:permissionName',
                app.config.apiPath + '/roles/:roleName/users'
            ],
            permissions: '*'
        }
    ];

    roles.forEach(function (role) {
        acl.allow(role.name, role.resources, role.permissions);
    });

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

    app.acl = acl;
};
