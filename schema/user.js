'use strict';
var Async = require('async'),
    Bcrypt = require('bcrypt');

exports = module.exports = function (app, mongoose) {
    var userSchema = new mongoose.Schema({
        email: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
            validate: [require('validator').isEmail, 'Invalid email!']
        },
        roles: {
            admin: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'admin'
            },
            account: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'account'
            }
        },
        resetPassword: {
            token: {
                type: String
            },
            expires: {
                type: Date
            }
        },
        timeCreated: {
            type: Date,
            default: Date.now
        }
    });
    userSchema.methods.canPlayRole = function (role) {

        if (!this.roles) {
            return false;
        }

        return this.roles.hasOwnProperty(role);
    };

    /**
     * Returns an object that has a role-field for each role (from User.roles { ... } field)
     * that exists in the referenced role collection (accounts, admins...).
     *
     * @param callback - a function that follows the NodeJS convention where the parameters usually are (error, result).
     * @returns {
     *      role: {
     *          id: <some id from the 'role' collection that exists>
     *      }
     * }
     */
    userSchema.methods.hydrateRoles = function (callback) {

        if (!this.roles) {
            this._roles = {};
            return callback(null, this._roles);
        }

        if (this._roles) {
            return callback(null, this._roles);
        }

        var self = this;
        var tasks = {};

        if (this.roles.account) {
            tasks.account = function (done) {

                app.db.model('account').findById(self.roles.account, done);
            };
        }

        if (this.roles.admin) {
            tasks.admin = function (done) {

                app.db.model('admin').findById(self.roles.admin, done);
            };
        }

        Async.auto(tasks, function (err, results) {

            if (err) {
                return callback(err);
            }

            self._roles = results;

            callback(null, self._roles);
        });
    };
    userSchema.plugin(require('./plugins/pagedFind'));
    userSchema.plugin(require('passport-local-mongoose'), {
        usernameLowerCase: true,
        limitAttempts: false,
        maxAttempts: app.config.loginAttempts.failedLoginAttempts
    });
    userSchema.index({username: 1}, {unique: true});
    userSchema.index({email: 1}, {unique: true});
    userSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('user', userSchema);

};
