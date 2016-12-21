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
    fs = require('fs'),
    path = require('path');

var loginPluginsData = [];

/**
 * @api {get} /loginplugins Returns all the registered login plugins.
 * @apiName GetLoginPlugins
 * @apiGroup LoginPlugins
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "data": [
 *          {
 *              "name": "SAML Stichting Praktijkleren",
 *              "pluginId": "samlnl"
 *          }]
 *      }
 *
 */
router.get('/', function (req, res, next) {
    res.json({data: loginPluginsData});
});


/**
 * Read all .js files from 'loginPlugins' directory
 * and import them
 */
var setupLoginPlugins = function (app) {
    var dirname = path.resolve(__dirname, './../loginPlugins/');
    var files = fs.readdirSync(dirname);
    if (!files || !files.length) {
        console.error('Could not list the directory.', dirname);
        return;
    }

    files.forEach(function (file) {
        // Make one pass and make the file complete
        if (file.charAt(0) !== '_') {
            var filePath = path.resolve(dirname, file);

            var stat = fs.statSync(filePath);
            if (!stat) {
                console.error('Error stating file.', file);
            } else {

                if (stat.isFile()) {
                    console.log('\'%s\' is a file.', filePath);
                    var fileFunction = require(filePath);
                    var loginPlugin = fileFunction(app);
                    app.use(app.config.apiPath + '/login', loginPlugin.router);
                    loginPluginsData.push({
                        name: loginPlugin.name || '',
                        pluginId: loginPlugin.pluginId
                    });
                    console.log('Successfully registered login plugin', loginPlugin.name, loginPlugin.pluginId);
                }
            }
        } else {
            console.log('Skipping login plugin', file);
        }
    });
};

module.exports = {
    router: router,
    setupLoginPlugins: setupLoginPlugins
};