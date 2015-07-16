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
 * @param mongodbUrl - Note that this value mustn't be the same in 'defaultValues' and 'testValues'.
 * @param redisdbHost -
 * @param redisPort -
 * @param redisdbNumber - Note that this value mustn't be the same in 'defaultValues' and 'testValues'.
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

exports.defaultValues = {
    projectName: 'Gleaner Users Module',
    companyName: 'e-UCM Research Group',
    mongodbUrl: 'mongodb://localhost:27017/gleaner-users',
    redisdbHost: '127.0.0.1',
    redisPort: '6379',
    redisdbNumber: '0',
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
    projectName: 'Gleaner Users Module (Test)',
    companyName: 'e-UCM Research Group (Test)',
    mongodbUrl: 'mongodb://localhost:27017/gleaner-users-test', // This must be different than 'exports.defaultValues.mongodbUrl'
    redisdbHost: '127.0.0.1',
    redisPort: '6379',
    redisdbNumber: '10',         // This must be different than 'exports.defaultValues.redisdbNumber'
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



