'use strict';

var Uuid = require('node-uuid'),
    Async = require('async');

exports = module.exports = function (app, mongoose) {
    var authAttemptSchema = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            lowercase: true,
            default: ''
        },
        ip: {
            type: String,
            required: true,
            default: ''
        },
        time: {
            type: Date,
            requires: true,
            default: Date.now
        }
    });

    authAttemptSchema.statics.create = function (ip, username, callback) {

        var document = {
            ip: ip,
            username: username.toLowerCase(),
            time: new Date()
        };

        var authAttemptModel = app.db.model('authAttempt');
        var authAttempt = new authAttemptModel(document);
        authAttempt.save(function(err, result) {
            if(err) {
                return callback(err);
            }

            callback(null, result);
        });
    };

    authAttemptSchema.statics.abuseDetected = function (ip, username, callback) {

        var autoAttemptModel = app.db.model('authAttempt');

        Async.auto({
            abusiveIpCount: function (done) {

                var query = { 
                    ip: ip
                };
                
                autoAttemptModel.count(query, done);
            },
            abusiveIpUserCount: function (done) {

                var query = {
                    ip: ip,
                    username: username.toLowerCase()
                };

                autoAttemptModel.count(query, done);
            }
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            var authAttemptsConfig = app.config.loginAttempts;
            var ipLimitReached = results.abusiveIpCount >= authAttemptsConfig.forIp;
            var ipUserLimitReached = results.abusiveIpUserCount >= authAttemptsConfig.forIpAndUser;

            callback(null, ipLimitReached || ipUserLimitReached);
        });
    };

    authAttemptSchema.index({'username': 1});
    authAttemptSchema.index({'ip': 1});
    authAttemptSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('authAttempt', authAttemptSchema);
}