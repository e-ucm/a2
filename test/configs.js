/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var should = require('should');

var configValues;
var config;
var testConfig;

describe('Config files  validations', function () {

    it('should return a correct config-values file', function (done) {
        configValues = require('../config-values.js');
        var keys = Object.keys(configValues);
        should(keys.length).equal(2);
        should(keys).containDeep(['defaultValues', 'testValues']);

        var defaultKeys = Object.keys(configValues.defaultValues);
        var testKeys = Object.keys(configValues.testValues);
        should(defaultKeys.length).equal(testKeys.length);
        should(defaultKeys).containDeep(testKeys);

        done();
    });

    it('should have generated correctly the config files', function (done) {
        config = require('../config.js');
        testConfig = require('../config-test.js');

        var configKeys = Object.keys(config);
        var testConfigKeys = Object.keys(testConfig);

        should(configKeys.length).equal(testConfigKeys.length);
        should(configKeys).containDeep(testConfigKeys);

        var toType = function(obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        };

        configKeys.forEach(function(configKey) {
            should(toType(configKeys[configKey])).equal(toType(testConfigKeys[configKey]));
        });

        done();
    });



    it('should have a correct content (config files)', function (done) {
        /**
         *   exports.port = process.env.PORT || 3000;
         *   exports.mongodb = {
         *     uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/a2'
         *   };
         *   exports.redisdb = {
         *     host: '127.0.0.1',
         *     port: 6379,
         *     dbNumber: 0
         *   };
         *   exports.apiPath = '/api';
         *   exports.companyName = 'e-UCM Research Group';
         *   exports.projectName = 'Authentication and Authorization';
         *   exports.systemEmail = 'system@email.com';
         *   exports.cryptoKey = 'th15_15_s3cr3t_5hhhh';
         *   exports.loginAttempts = {
         *     failedLoginAttempts: 25
         *   };
         *   exports.tokenExpirationInSeconds = 7 * 86400;
         *   exports.requireAccountVerification = false;
         *   exports.smtp = {
         *     from: {
         *       name: process.env.SMTP_FROM_NAME || exports.projectName,
         *       address: process.env.SMTP_FROM_ADDRESS || exports.systemEmail
         *     },
         *     credentials: {
         *       user: process.env.SMTP_USERNAME || '',
         *       password: process.env.SMTP_PASSWORD || '',
         *       host: process.env.SMTP_HOST || 'smtp.gmail.com',
         *       ssl: true
         *     }
         *   };
         */

        should(config.port).be.a.Number();
        should(config.mongodb).be.an.Object();
        should(config.mongodb.uri).be.a.String();
        should(config.mongodb.uri.indexOf('mongodb://')).equal(0);
        should(config.apiPath).be.a.String();
        should(config.companyName).be.a.String();
        should(config.projectName).be.a.String();
        should(config.apiPath).be.a.String();
        should(config.cryptoKey).be.a.String();
        should(config.redisdb).be.an.Object();
        should(config.redisdb.host).be.a.String();
        should(config.redisdb.port).be.a.Number();
        should(config.redisdb.dbNumber).be.a.Number();
        should(config.tokenExpirationInSeconds).be.a.Number();
        should(config.requireAccountVerification).be.a.Boolean();
        should(config.smtp).be.an.Object();
        should(config.smtp.from).be.an.Object();
        should(config.smtp.from.name).be.a.String();
        should(config.smtp.credentials).be.an.Object();
        should(config.smtp.credentials.user).be.an.String();
        should(config.smtp.credentials.password).be.an.String();
        should(config.smtp.credentials.host).be.an.String();
        should(config.smtp.credentials.ssl).be.an.Boolean();


        should(testConfig.port).be.a.Number();
        should(testConfig.mongodb).be.an.Object();
        should(testConfig.mongodb.uri).be.a.String();
        should(testConfig.mongodb.uri.indexOf('mongodb://')).equal(0);
        should(testConfig.apiPath).be.a.String();
        should(testConfig.companyName).be.a.String();
        should(testConfig.projectName).be.a.String();
        should(testConfig.apiPath).be.a.String();
        should(testConfig.cryptoKey).be.a.String();
        should(testConfig.redisdb).be.an.Object();
        should(testConfig.redisdb.host).be.a.String();
        should(testConfig.redisdb.port).be.a.Number();
        should(testConfig.redisdb.dbNumber).be.a.Number();
        should(testConfig.tokenExpirationInSeconds).be.a.Number();
        should(testConfig.requireAccountVerification).be.a.Boolean();
        should(testConfig.smtp).be.an.Object();
        should(testConfig.smtp.from).be.an.Object();
        should(testConfig.smtp.from.name).be.a.String();
        should(testConfig.smtp.credentials).be.an.Object();
        should(testConfig.smtp.credentials.user).be.an.String();
        should(testConfig.smtp.credentials.password).be.an.String();
        should(testConfig.smtp.credentials.host).be.an.String();
        should(testConfig.smtp.credentials.ssl).be.an.Boolean();

        should(config.mongodb.uri).not.equal(testConfig.mongodb.uri);
        should(config.redisdb.dbNumber).not.equal(testConfig.redisdb.dbNumber);

        done();
    });
});