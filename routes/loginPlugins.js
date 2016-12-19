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
    router = express.Router();

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
 *              "_id": "559a447831b7acec185bf513",
 *              "name": "SAML Stichting Praktijkleren",
 *              "pluginId": "samlnl",
 *              "timeCreated": "2015-07-06T09:03:52.636Z"
 *          }]
 *      }
 *
 */
router.get('/', function (req, res, next) {

    req.app.db.model('loginPlugin').find().exec(function (err, results) {

        if (err) {
            return next(err);
        }

        res.json({data: results});
    });
});

module.exports = router;