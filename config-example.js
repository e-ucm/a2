'use strict';

exports.port = process.env.PORT || 3000;
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || '{{mongodbUrl}}'
};
exports.redisdb = {
  host: '{{redisHost}}',
  port: {{redisPort}},
  dbNumber: {{redisNumber}}
};
exports.apiPath = '{{apiPath}}';
exports.companyName = '{{companyName}}';
exports.projectName = '{{projectName}}';
exports.systemEmail = '{{systemEmail}}';
exports.cryptoKey = '{{cryptoKey}}';
exports.loginAttempts = {
  failedLoginAttempts: {{failedLoginAttempts}}
};
exports.tokenExpirationInSeconds = 7 * 86400;
exports.requireAccountVerification = false;
exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName,
    address: process.env.SMTP_FROM_ADDRESS || exports.systemEmail
  },
  credentials: {
    user: process.env.SMTP_USERNAME || '{{smtpUsername}}',
    password: process.env.SMTP_PASSWORD || '{{smtpPassword}}',
    host: process.env.SMTP_HOST || '{{smtpHost}}',
    ssl: true
  }
};