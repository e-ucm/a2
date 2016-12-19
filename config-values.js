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

/**
 * This file exports two objects ('defaultValues' and 'testValues') with the information needed to
 * create the 'config.js' and 'config-test.js' files, as specified in the file 'setup.js'.
 *
 * config.js is used in when we are not performing tests over the application ('npm start').
 * config-test.js is used when the tests are launched ('npm test').
 *
 * For more information about the configuration files, take a lok at 'setup.js' to see how generates
 * the files from the 'config-example.js' file.
 *
 * The following values are needed for the configuration.
 *
 * @param projectName - Used in the 'subject' of the emails received (contact form) or sent (password reset).
 * @param companyName -
 * @param mongoHost - Used to build 'mongodbUrl'
 * @param mongoPort - Used to build 'mongodbUrl'
 * @param mongodbUrl - Note that this value mustn't be the same in 'defaultValues' and 'testValues'.
 * @param redisHost -
 * @param redisPort -
 * @param redisNumber - Note that this value mustn't be the same in 'defaultValues' and 'testValues'.
 * @param cryptoKey - Used to create a hash from the user passwords and to sign and verify the JWT.
 * @param rootEmail - Email of the root user (the main admin).
 * @param rootPassword - Node that the root user name is 'root'.
 * @param systemEmail - The email used to receive the emails from the contact form.
 * @param smtpHost - SMTP data needed to send/receive emails.
 * @param smtpUsername -
 * @param smtpPassword -
 * @param failedLoginAttempts - The amount of failed login attempts before blocking the account.
 * @param apiPath - prefix for the REST API requests.
 */


/**
 * Initializes 'conf' properties with values read from the environment.
 * The environment values must have the following format:
 *      'prefix' + 'conf.propertyKey'
 *          or
 *      'prefix' + 'conf.propertyKey.toUpperCase()'
 *
 * 'links' is an array with values that, when appended '_PORT', can be found in the environment.
 * Is useful for a faster parse of some values such as mongo/redis host/port.
 *
 * @param conf
 * @param prefix
 * @param links
 */
function initFromEnv(conf, prefix, links) {

    for (var item in conf) {
        var envItem = process.env[prefix + item];
        if (!envItem) {
            envItem = process.env[prefix + item.toUpperCase()];
        }
        if (envItem) {
            conf[item] = envItem;
        }
    }

    links.forEach(function (link) {
        var linkPort = process.env[link.toUpperCase() + '_PORT'];
        if (linkPort) {
            /*
             We want to end up with:
             conf.redisHost = 172.17.0.17;
             conf.redisPort = 6379;
             Starting with values like this:
             REDIS_PORT=tcp://172.17.0.17:6379
             */
            var values = linkPort.split('://');
            if (values.length === 2) {
                values = values[1].split(':');
                if (values.length === 2) {
                    conf[link + 'Host'] = values[0];
                    conf[link + 'Port'] = values[1];
                }
            }
        }
    });
}


exports.defaultValues = {
    projectName: 'Authentication and Authorization',
    companyName: 'e-UCM Research Group',
    mongoHost: 'localhost',
    mongoPort: '27017',
    mongodbUrl: 'mongodb://localhost:27017/a2',
    redisHost: '127.0.0.1',
    redisPort: '6379',
    redisNumber: '0',
    cryptoKey: 'th15_15_s3cr3t_5hhhh',
    rootEmail: 'root@email.com',
    rootPassword: 'root',
    systemEmail: 'system@email.com',
    smtpHost: 'smtp.gmail.com',
    smtpUsername: '',
    smtpPassword: '',
    failedLoginAttempts: 25,
    apiPath: '/api'
};

exports.testValues = {
    projectName: 'A2 Module (Test)',
    companyName: 'e-UCM Research Group (Test)',
    mongoHost: 'localhost',
    mongoPort: '27017',
    mongodbUrl: 'mongodb://localhost:27017/a2-test', // This must be different than 'exports.defaultValues.mongodbUrl'
    redisHost: '127.0.0.1',
    redisPort: '6379',
    redisNumber: '10',         // This must be different than 'exports.defaultValues.redisNumber'
    cryptoKey: 'th15_15_a_t35t_5hhhh',
    rootEmail: 'root-test@email.com',
    rootPassword: 'root-test',
    systemEmail: 'system-test@email.com',
    smtpHost: 'smtp.gmail.com',
    smtpUsername: '',
    smtpPassword: '',
    failedLoginAttempts: 25,
    apiPath: '/api'
};

var prefix = 'A2_';
var links = ['redis', 'mongo'];
initFromEnv(exports.defaultValues, prefix, links);
initFromEnv(exports.testValues, prefix, links);

// Some control instructions

// Ensuring that 'mongodbUrl' values are different
exports.defaultValues.mongodbUrl = 'mongodb://' + exports.defaultValues.mongoHost + ':' + exports.defaultValues.mongoPort + '/a2';
exports.testValues.mongodbUrl = exports.defaultValues.mongodbUrl + '-test';

// Ensuring that 'redisNumber' values are different
if (exports.defaultValues.redisNumber === exports.testValues.redisNumber) {
    exports.testValues.redisNumber = exports.defaultValues.redisNumber + 1;
}
