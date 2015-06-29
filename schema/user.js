'use strict';
var Async = require('async'),
    Bcrypt = require('bcrypt');

exports = module.exports = function (app, mongoose) {
    var userSchema = new mongoose.Schema({
        username: {
            type: String,
            unique: true,
            required: true
        },
        password: String,
        email: {
            type: String,
            unique: true,
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
        isActive: {
            type: Boolean,
            default: true
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

                app.db.model('account').findById(self.roles.account.id, done);
            };
        }

        if (this.roles.admin) {
            tasks.admin = function (done) {

                app.db.model('admin').findById(self.roles.admin.id, done);
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
    userSchema.statics.generatePasswordHash = function (password, callback) {

        Async.auto({
            salt: function (done) {

                Bcrypt.genSalt(10, done);
            },
            hash: ['salt', function (done, results) {

                Bcrypt.hash(password, results.salt, done);
            }]
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            callback(null, {
                password: password,
                hash: results.hash
            });
        });
    };
    userSchema.statics.create = function (username, password, email, callback) {

        Async.auto({
            passwordHash: this.generatePasswordHash.bind(this, password),
            newUser: ['passwordHash', function (done, results) {

                var document = {
                    isActive: true,
                    username: username.toLowerCase(),
                    password: results.passwordHash.hash,
                    email: email.toLowerCase(),
                    timeCreated: new Date()
                };

                var UserModel = app.db.model('user');
                var user = new UserModel(document);
                user.save(done);
            }]
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            results.newUser[0].password = results.passwordHash.password;

            callback(null, results.newUser[0]);
        });
    };
    userSchema.statics.findByCredentials = function (username, password, callback) {

        Async.auto({
            user: function (done) {

                var query = {
                    isActive: true
                };

                if (username.indexOf('@') > -1) {
                    query.email = username.toLowerCase();
                }
                else {
                    query.username = username.toLowerCase();
                }

                app.db.model('user').findOne(query, done);
            },
            passwordMatch: ['user', function (done, results) {

                if (!results.user) {
                    return done(null, false);
                }

                var source = results.user.password;
                Bcrypt.compare(password, source, done);
            }]
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            if (results.passwordMatch) {
                return callback(null, results.user);
            }

            callback();
        });
    };
    userSchema.statics.findByUsername = function (username, callback) {

        var query = {username: username.toLowerCase()};
        app.db.model('user').findOne(query, callback);
    };
    userSchema.plugin(require('./plugins/pagedFind'));
    userSchema.index({username: 1}, {unique: true});
    userSchema.index({email: 1}, {unique: true});
    userSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('user', userSchema);

};
