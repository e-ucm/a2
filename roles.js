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

    var acl = require('acl');
    var acl = new acl(new acl.mongodbBackend(app.db.db, 'acl_'), app.get('env') == 'development' ? logger() : null);

    var admin = {
        name: 'admin',
        resources: [
            app.config.apiPath + '/users',
            app.config.apiPath + '/users/:userId',
            app.config.apiPath + '/users/:userId/roles',
            app.config.apiPath + '/users/:userId/roles/:roleName',
            app.config.apiPath + '/roles',
            app.config.apiPath + '/roles/:roleName',
            app.config.apiPath + '/roles/:roleName/resources',
            app.config.apiPath + '/roles/:roleName/resources/:resourceName',
            app.config.apiPath + '/roles/:roleName/resources/:resourceName/permissions',
            app.config.apiPath + '/roles/:roleName/resources/:resourceName/permissions/:permissionName',
            app.config.apiPath + '/roles/:roleName/users'
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

    app.acl = acl;
};
