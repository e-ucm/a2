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

var validator = require('validator');

var validateEmail = function(email) {
    if (email) {
        try {
            return validator.isEmail(email);
        } catch (ex) {
            return false;
        }
    }
    return false;
};

/**
    Schema for the user. This schema contains the next fields:
        email, unique and used to recover the user password and to contact with the developers by use of form
        name, the real name of the user
        resetPassword,this field is used to change the password if the user forgets it.
        verification, this field is used to verify the user mail.
        timeCreated, when the user has been registered
        externalId, this field is used to link a user with an external login platform
 */
module.exports = function (app, mongoose) {
    mongoose.Promise = global.Promise;
    var userSchema = new mongoose.Schema({
        email: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
            validate: [validateEmail, 'Invalid email!']
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
        },
        externalId: {
            type: 'array',
            required: false,
            items: {
                type: 'object',
                properties: {
                    domain: {
                        type: 'string',
                        required: true
                    },
                    id: {
                        type: 'string',
                        required: true
                    }
                }
            }
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
    userSchema.set('autoIndex', true);
    app.db.model('user', userSchema);

};
