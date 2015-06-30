'use strict';

var Async = require('async');

exports = module.exports = function (app, mongoose) {
    var adminSchema = new mongoose.Schema({
        user: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'User'
            },
            name: {
                type: String,
                required: true,
                default: ''
            }
        },
        name: {
            first: {
                type: String,
                default: ''
            },
            middle: {
                type: String,
                default: ''
            },
            last: {
                type: String,
                default: ''
            }
        },
        groups: {
            /*
             groupId: groupName,
             ...

             E.g:
             "groups": {
                 "sales": "Sales",
                 "vips": "VIPs"
             }
             */
        },
        permissions: {
            /*
             permission_ID_key: Boolean,
             ...

             E.g:
             "permissions": {
                 "ACCESS_SALES_REPORTS": true,
                 "ACCESS_ACCOUNTS": true
             }
             */
        },
        timeCreated: {
            type: Date,
            default: Date.now
        }
    });

    adminSchema.methods.isMemberOf = function (group) {

        if (!this.groups) {
            return false;
        }

        return this.groups.hasOwnProperty(group);
    };

    /**
     * Returns an object that has a group-field for each group (from Admin.groups { ... } field)
     * that exists in the referenced 'Admin-Groups' collection.
     *
     * @param callback - a function that follows the NodeJS convention where the parameters usually are (error, result).
     * @returns {
     *      groups: {
     *          <existing groupId>: groupName
     *      }
     * }
     */
    adminSchema.methods.hydrateGroups = function (callback) {

        if (!this.groups) {
            this._groups = {};
            return callback(null, this._groups);
        }

        if (this._groups) {
            return callback(null, this._groups);
        }

        var self = this;
        var tasks = {};

        Object.keys(this.groups).forEach(function (group) {

            tasks[group] = function (done) {

                app.db.model('admin-group').findById(group, done);
            };
        });

        Async.auto(tasks, function (err, results) {

            if (err) {
                return callback(err);
            }

            self._groups = results;

            callback(null, self._groups);
        });
    };

    adminSchema.methods.hasPermissionTo = function (permission, callback) {

        if (this.permissions && this.permissions.hasOwnProperty(permission)) {
            return callback(null, this.permissions[permission]);
        }

        var self = this;

        this.hydrateGroups(function (err) {

            if (err) {
                return callback(err);
            }

            var groupHasPermission = false;

            Object.keys(self._groups).forEach(function (group) {

                if (self._groups[group].hasPermissionTo(permission)) {
                    groupHasPermission = true;
                }
            });

            callback(null, groupHasPermission);
        });
    };

    adminSchema.statics.create = function (userId, username, name, callback) {
        var nameParts = name.trim().split(/\s/);

        var document = {
            name: {
                first: nameParts.shift(),
                middle: nameParts.length > 1 ? nameParts.shift() : undefined,
                last: nameParts.join(' ')
            },
            user : {
                id : userId,
                name :  username
            },
            timeCreated: new Date()
        };

        var AdminModel = app.db.model('admin');

        var admin = new AdminModel(document);
        admin.save(function(err, result) {
            if(err) {
                return callback(err);
            }

            callback(null, result);
        });
    };

    adminSchema.statics.findByUsername = function (username, callback) {

        var query = {'user.name': username.toLowerCase()};
        app.db.model('admin').findOne(query, callback);
    };

    adminSchema.plugin(require('./plugins/pagedFind'));
    adminSchema.index({'user.id': 1});
    adminSchema.index({'user.name': 1});
    adminSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('admin', adminSchema);
};
