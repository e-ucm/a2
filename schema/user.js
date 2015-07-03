'use strict';

exports = module.exports = function (app, mongoose) {
    var userSchema = new mongoose.Schema({
        email: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
            validate: [require('validator').isEmail, 'Invalid email!']
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
        resetPassword: {
            token: {
                type: String
            },
            expires: {
                type: Date
            }
        },
        verification: {
            complete: {
                type: Boolean,
                default: false
            },
            token: {
                type: String
            }
        },
        timeCreated: {
            type: Date,
            default: Date.now
        }
    });
    userSchema.plugin(require('./plugins/pagedFind'));
    userSchema.plugin(require('passport-local-mongoose'), {
        /**
         * This plugin adds some fields and methods to the schemas that it's applied to.
         *  Fields like: username, hash, salt, attempts, last.
         *  Methods like: register, findByUserName, resetAttempts(callback), etc.
         *
         *  These fields and the messages returned by the methods
         *  are configurable by passing an options parameter.
         *  More info about the options that can be passed here:
         *      https://github.com/saintedlama/passport-local-mongoose#options
         */

        usernameLowerCase: true,
        limitAttempts: false,
        maxAttempts: app.config.loginAttempts.failedLoginAttempts
    });
    userSchema.index({username: 1}, {unique: true});
    userSchema.index({email: 1}, {unique: true});
    userSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('user', userSchema);

};
