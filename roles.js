'use strict';

exports = module.exports = function (app) {

    // Generic debug logger for node_acl
    function logger() {
        return {
            debug: function( msg ) {
                console.log( '-DEBUG-ACL:', msg );
            }
        };
    }

    var acl = require('acl');
    var acl = new acl(new acl.mongodbBackend(app.db.db, 'acl_'), logger() );

    var roles = [
        {
            name: 'admin',
            resources: [
                app.config.apiPath + '/users',
                app.config.apiPath + '/users/:userId'
            ],
            permissions: '*'
        }
    ];
    roles.forEach(function(role) {
        acl.allow(role.name, role.resources, role.permissions);
    })
    app.acl = acl;
};
