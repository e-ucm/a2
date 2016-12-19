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
    var loginPlugin = new mongoose.Schema({
        pluginId: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
            trim: true
        },
        name: {
            type: String
        },
        timeCreated: {
            type: Date,
            default: Date.now
        }
    });

    /**
     * Creates a loginPlugin with the given values.
     * If the loginPlugin already exists it overrides it with the new values (supposing the
     * new application's owner is the original application's creator).
     * @param loginPlugin
     * @param cb
     * @returns the created/updated loginPlugin.
     */
    loginPlugin.statics.create = function (loginPlugin, cb) {

        if (!loginPlugin) {
            return cb(new Error('The loginPlugin argument cannot be undefined!'));
        }

        if (!loginPlugin.pluginId) {
            return cb(new Error('The loginPlugin must have a pluginId attribute!'));
        }

        var Self = this;
        Self.findByPluginId(loginPlugin.pluginId, function (err, existingLoginPlugin) {

            if (err) {
                return cb(err);
            }

            if (existingLoginPlugin) {
                for (var key in loginPlugin) {
                    if (key !== '_id' && loginPlugin.hasOwnProperty(key)) {
                        existingLoginPlugin[key] = loginPlugin[key];
                    }
                }
                return existingLoginPlugin.save(function (err) {
                    if (err) {
                        return cb(err);
                    }

                    return cb(null, existingLoginPlugin);
                });
            }

            // Create an instance of Self in case loginPlugin isn't already an instance
            if (!(loginPlugin instanceof Self)) {
                loginPlugin = new Self(loginPlugin);
            }

            loginPlugin.save(function (err) {
                if (err) {
                    return cb(err);
                }

                cb(null, loginPlugin);
            });
        });
    };

    loginPlugin.statics.findByPluginId = function (pluginId, cb) {
        var queryParameters = {};

        // Convert the prefix to lowercase
        if (pluginId !== undefined) {
            pluginId = pluginId.toLowerCase();
        }

        queryParameters.pluginId = pluginId;

        var query = this.findOne(queryParameters);

        if (cb) {
            query.exec(cb);
        } else {
            return query;
        }
    };

    loginPlugin.index({pluginId: 1}, {unique: true});
    loginPlugin.set('autoIndex', true);
    app.db.model('loginPlugin', loginPlugin);

};
