#!/usr/bin/env node
'use strict';

/**
 * This file is used to generate 'config.js' (used during execution 'npm start') and
 * 'config-test.js' (used while testing 'npm test') files.
 *
 * In order to create the files, needs some predefined values stored in 'config-values.js'.
 * For more information about these values, checkout 'config-values.js'.
 *
 * config.js is generated using the 'defaultValues' from 'config-values.js'.
 * config-test.js is generated using the 'testValues' from 'config-values.js'.
 *
 * Also creates a 'root' user in the database with the 'admin' role.
 * Its credentials are:
 *      Username:   'root'.
 *      Password:   @see 'defaultValues.rootPassword'   @ 'config-values.js'.
 *      Email:      @see 'defaultValues.rootEmail'      @ 'config-values.js'.
 *
 * Note:
 *      This script cleans the database before creating the 'root' user.
 *
 * Usage:
 *
 *      'npm run-script setup' - Generates the files asking the user for the values and suggesting the default values from 'config-values.js'.
 *      'npm run-script fast-setup' - Generates the files directly using the values from 'config-values.js'.
 *
 */

var Fs = require('fs');
var Path = require('path');
var Async = require('async');
var Promptly = require('promptly');
var Mongodb = require('mongodb');
var Handlebars = require('handlebars');

var configTemplatePath = Path.resolve(__dirname, 'config-example.js');
var configPath = Path.resolve(__dirname, 'config.js');
var configTestPath = Path.resolve(__dirname, 'config-test.js');

var configValue = require('./config-values');
var defaultValues = configValue.defaultValues;
var testValues = configValue.testValues;

var registerRoot = function (options, callback) {

    var username = 'root';
    var adminRole = 'admin';

    var mongodbUrl = options.mongodbUrl;
    var email = options.rootEmail;
    var password = options.rootPassword;
    var failedLoginAttempts = options.failedLoginAttempts;
    var apiPath = options.apiPath;

    var mongoose = require('mongoose');
    var app = {
        get: function (key) {
            return key;
        },
        config: {
            apiPath: apiPath,
            loginAttempts: {
                failedLoginAttempts: failedLoginAttempts
            }
        },
        db: mongoose.createConnection(mongodbUrl)
    };
    app.db.on('error', callback);
    app.db.on('connected', function () {

        require('./schema/user.js')(app, mongoose);
        var UserModel = app.db.model('user');

        app.db.db.dropDatabase();

        UserModel.register(new UserModel({
            username: username,
            email: email
        }), password, function (err, user) {

            if (err) {
                console.error('Failed to register \'root\' user.');
                return callback(err);
            }
            if (!user) {
                err = new Error('Failed to register \'root\' user.');
                return callback(err);
            }


            require('./roles.js')(app, function (err) {
                if (err) {
                    console.error('Failed to load the roles.');
                    return callback(err);
                }
                app.acl.addUserRoles(user.username, adminRole, function (err) {

                    if (err) {
                        console.error('Failed to setup root user.');
                        return callback(err);
                    }

                    callback(null, true);
                });
            });
        });
    });
};

if (process.env.NODE_ENV === 'test') {

    registerRoot(defaultValues, function (err, res) {
        if (err || !res) {
            return console.error(err);
        }

        var options = {
            encoding: 'utf-8'
        };
        var source = Fs.readFileSync(configTemplatePath, options);
        var configTemplate = Handlebars.compile(source);
        Fs.writeFileSync(configPath, configTemplate(defaultValues));
        Fs.writeFileSync(configTestPath, configTemplate(testValues));
        console.log('Setup complete.');
        process.exit(0);
    });
} else {
    Async.auto({

        projectName: function (done) {

            var promptOptions = {
                default: defaultValues.projectName || 'Gleaner Users Module'
            };

            Promptly.prompt('Project name: (' + promptOptions.default + ')', promptOptions, done);
        },
        companyName: ['projectName', function (done) {

            var promptOptions = {
                default: defaultValues.companyName || 'e-UCM Research Group'
            };

            Promptly.prompt('Company name: (' + promptOptions.default + ')', promptOptions, done);
        }],
        mongodbUrl: ['companyName', function (done) {

            var promptOptions = {
                default: defaultValues.mongodbUrl || 'mongodb://localhost:27017/gleaner-users'
            };

            Promptly.prompt('MongoDB URL: (' + promptOptions.default + ')', promptOptions, done);
        }],
        testMongo: ['mongodbUrl', function (done, results) {
            Mongodb.MongoClient.connect(results.mongodbUrl, {}, function (err, db) {

                if (err) {
                    console.error('Failed to connect to Mongodb.');
                    return done(err);
                }

                db.close();
            });
            done(null, true);
        }],
        redisdbHost: ['testMongo', function (done) {

            var promptOptions = {
                default: defaultValues.redisdbHost || '127.0.0.1'
            };

            Promptly.prompt('Redis DB host: (' + promptOptions.default + ')', promptOptions, done);
        }],
        redisPort: ['redisdbHost', function (done) {

            var promptOptions = {
                default: defaultValues.redisPort || '6379'
            };

            Promptly.prompt('Redis DB port: (' + promptOptions.default + ')', promptOptions, done);
        }],
        redisdbNumber: ['redisPort', function (done) {

            var promptOptions = {
                default: defaultValues.redisdbNumber || '0'
            };

            Promptly.prompt('Redis DB number: (' + promptOptions.default + ')', promptOptions, done);
        }],
        cryptoKey: ['redisdbNumber', function (done) {

            var promptOptions = {
                default: defaultValues.cryptoKey || 'th15_15_s3cr3t_5hhhh'
            };

            Promptly.password('Crypto secret key: (' + promptOptions.default + ')', promptOptions, done);
        }],
        rootEmail: ['cryptoKey', function (done) {

            var promptOptions = {
                default: defaultValues.rootEmail || 'root@email.com'
            };

            Promptly.prompt('Root user email: (' + promptOptions.default + ')', promptOptions, done);
        }],
        rootPassword: ['rootEmail', function (done) {

            var promptOptions = {
                default: defaultValues.rootPassword || 'root'
            };

            Promptly.password('Root user password: (' + promptOptions.default + ')', promptOptions, done);
        }],
        systemEmail: ['rootPassword', function (done, results) {

            var promptOptions = {
                default: defaultValues.systemEmail || (results.rootEmail || 'system@email.com')
            };

            Promptly.prompt('System email: (' + promptOptions.default + ')', promptOptions, done);
        }],
        smtpHost: ['systemEmail', function (done) {

            var promptOptions = {
                default: defaultValues.smtpHost || 'smtp.gmail.com'
            };

            Promptly.prompt('SMTP host: (' + promptOptions.default + ')', promptOptions, done);
        }],
        smtpUsername: ['smtpHost', function (done, results) {

            var promptOptions = {
                default: defaultValues.smtpUsername || (results.systemEmail || '')
            };

            Promptly.prompt('SMTP username/email: (' + promptOptions.default + ')', promptOptions, done);
        }],
        smtpPassword: ['smtpUsername', function (done) {

            var promptOptions = {
                default: defaultValues.smtpPassword || ''
            };

            Promptly.password('SMTP password: (' + promptOptions.default + ')', promptOptions, done);
        }],
        createConfig: ['smtpPassword', function (done, results) {

            var fsOptions = {
                encoding: 'utf-8'
            };

            Fs.readFile(configTemplatePath, fsOptions, function (err, src) {

                if (err) {
                    console.error('Failed to read config-example template.');
                    return done(err);
                }

                for(var result in results) {
                    if(results.hasOwnProperty(result)) {
                        defaultValues[result] = results[result];
                    }
                }

                var configTemplate = Handlebars.compile(src);
                Fs.writeFile(configPath, configTemplate(defaultValues), function (err) {
                    if (err) {
                        console.error('Failed to write config.js file.');
                        return done(err);
                    }
                    Fs.writeFile(configTestPath, configTemplate(testValues), done);
                });
            });
        }],
        setupRootUser: ['createConfig', function (done, results) {

            results.apiPath = defaultValues.apiPath;
            registerRoot(results, done);

        }]
    }, function (err) {

        if (err) {
            console.error('Setup failed.');
            console.error(err);
            return process.exit(1);
        }

        console.log('Setup complete.');
        process.exit(0);
    });
}