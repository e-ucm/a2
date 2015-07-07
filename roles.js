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

    var Acl = require('acl');
    var acl = new Acl(require('./backends/mongodb.js')(app, Acl), logger() );

    var roles = [
        {
            name: 'admin',
            resources: [
                app.config.apiPath + '/users',
                app.config.apiPath + '/users/:userId',
                app.config.apiPath + '/roles'
            ],
            permissions: '*'
        }
    ];

    roles.forEach(function(role) {
        acl.allow(role.name, role.resources, role.permissions);
    });

    /**
     * Return an array with all roles
     *
     */
    acl.listRoles = function(cb){
        acl.backend.getAll(acl.options.buckets.roles, ['key'], function (err, result){
            if(err) {
                cb(err);
            }

            var res = [];
            result.forEach(function (item){
                res.push(item.key)
            });

            cb(null, res);
        })
    }

    app.acl = acl;
};
