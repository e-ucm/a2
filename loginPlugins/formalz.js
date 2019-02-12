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

var express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    async = require('async');

/**
 * The 'plugin id'. Unique identifier of the plugin that is used to identify it.
 * It's used to set up the route of this plugin, e.g. '/login/pluginId' -> (pluginId = samlnl) -> '/login/samlnl'
 *
 * @type {string}
 */
var pluginId = 'formalz';

/**
 * Plugin name.
 * @type {string}
 */
var pluginName = 'formalz';

function oauthSetup(app) {

    var userExists = function (id, db, callback) {
        db.model('user').findOne({ externalId: { $elemMatch: { domain:'formalz', id: id.toString() } } }, function (err, user) {
            if (err) {
                console.log(err);
                return callback(err);
            }

            if (!user) {
                err = new Error('No account with that username exists.');
                err.status = 400;
                return callback(err);
            }else{
                callback(null, user);
            }
        });
    };

    router.post('/formalz', function (req, res) {
        if(!req.body.id){
            res.status(400);
            return res.json({message: 'Missing id in body'});
        }

        userExists(req.body.id, app.db, function(error, user){
            if(error){
                res.status(error.status);
                return res.json({message: 'Unable to obtain user profile: ' + error.message});
            }

            generateAccessToken(req, user, function(e, accesstoken){
                res.json({user: {_id: user._id, username: user.username, token: accesstoken}});
            });
        });
    });

    var generateAccessToken = function(req, user, cb){
        async.waterfall([
            /*Generate a random number*/
            function (done) {
                require('crypto').randomBytes(10, function (err, buf) {
                    if (err) {
                        return done(err);
                    }
                    var randNum = buf.toString('hex');
                    done(null, randNum);
                });
            },
            /*Generate the token*/
            function (randNum, done) {
                var data = {
                    _id: user._id,
                    randNum: randNum
                };

                var expirationInSec = req.app.config.tokenExpirationInSeconds;
                var token = jwt.sign(data, req.app.config.cryptoKey, {
                    expiresIn: expirationInSec
                });

                req.app.tokenStorage.save(token, {
                    username: user.username
                }, expirationInSec, done);
            }
        ], function (error, result) {
            cb(error, result);
        });
    };

    return {
        router: router,
        name: pluginName,
        pluginId: pluginId
    };
}

module.exports = oauthSetup;