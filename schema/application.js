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

exports = module.exports = function (app, mongoose) {
    var application = new mongoose.Schema({
        prefix: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
            trim: true
        },
        host: {
            type: String,
            unique: true,
            lowercase: true,
            required: true
        },
        name: {
            type: String
        },
        owner: {
            type: String,
            required: true
        },
        look: [{
            key: String,
            permissions: Object,
            methods: [String],
            url: String
        }],
        anonymous: [String],    // Anonymous(unprotected) routes defined by the application
        routes: [String],       // Protected routes defined by the application
        autoroles: [String],    // The roles that can be auto-assigned by the users when they create a new account
        timeCreated: {
            type: Date,
            default: Date.now
        }
    });

    /**
     * Creates an application with the given values.
     * If the application already exists it overrides it with the new values (supposing the
     * new application's owner is the original application's creator).
     * @param application
     * @param cb
     * @returns the created/updated application.
     */
    application.statics.create = function (application, cb) {

        if (!application) {
            return cb(new Error('The application argument cannot be undefined!'));
        }

        if (!application.prefix) {
            return cb(new Error('The application must have a prefix attribute!'));
        }

        var Self = this;
        Self.findByPrefix(application.prefix, function (err, existingApplication) {

            if (err) {
                return cb(err);
            }

            if (existingApplication) {
                if (application.owner === existingApplication.owner) {
                    for (var key in application) {
                        if (key !== '_id' && application.hasOwnProperty(key)) {
                            existingApplication[key] = application[key];
                        }
                    }
                    return existingApplication.save(function (err) {
                        if (err) {
                            return cb(err);
                        }

                        cb(null, existingApplication);
                    });
                }
                return cb(new Error('You don\'t have permission to modify this application!'));

            }

            // Create an instance of Self in case application isn't already an instance
            if (!(application instanceof Self)) {
                application = new Self(application);
            }

            application.save(function (err) {
                if (err) {
                    return cb(err);
                }

                cb(null, application);
            });
        });
    };

    application.statics.findByPrefix = function (prefix, cb) {
        var queryParameters = {};

        // Convert the prefix to lowercase
        if (prefix !== undefined) {
            prefix = prefix.toLowerCase();
        }

        queryParameters.prefix = prefix;

        var query = this.findOne(queryParameters);

        if (cb) {
            query.exec(cb);
        } else {
            return query;
        }
    };

    application.plugin(require('./plugins/pagedFind'));
    application.index({prefix: 1}, {unique: true});
    application.set('autoIndex', true);
    app.db.model('application', application);

};
