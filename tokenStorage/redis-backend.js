/**
 * A backend for the 'token-storage' plug in that stores
 * its data inside a Redis database where the 'tokens'
 * are mapped as keys and the 'data' their value.
 */

'use strict';

var _ = require('lodash');

var RedisBackend = function (options) {
    var client = require('redis').createClient(options.port, options.host, {});

    client.select(options.dbNumber || 0);

    var fetchToken = function (req) {
        if (req.headers && req.headers.authorization) {
            var parts = req.headers.authorization.split(' ');
            if (parts.length === 2) {
                var scheme = parts[0];
                var credentials = parts[1];

                if (/^Bearer$/i.test(scheme)) {
                    return credentials;

                }
            }
        }
        return null;
    };

    this.middleware = function (req, res, next) {
        var token = fetchToken(req);
        if (!token) {
            var err = new Error('Format is Authorization: Bearer [token]');
            err.status = 401;
            return next(err);
        }

        client.get(token, function (err, reply) {
            if (err) {
                return next(err);
            }

            if (reply) {
                var data = JSON.parse(reply);
                req.user = _.merge(req.user, data);
                return next();
            } else {
                req.user = undefined;
                err = new Error('Token doesn\'t exist, login into the system so it can generate a new token.');
                err.status = 401;
                next(err);
            }
        });

    };

    this.save = function (token, data, expirationInSec, callback) {
        client.set(token, JSON.stringify(data), function (err, reply) {
            if (err) {
                return callback(err);
            }

            if (reply) {
                client.expire(token, expirationInSec, function (err, reply) {
                    if (err) {
                        return callback(new Error('Can not set the expire value for the token key'));
                    }
                    if (reply) {
                        callback(null, token); // We have succeeded
                    } else {
                        callback(new Error('Expiration not set on redis'));
                    }
                });
            } else {
                callback(new Error('Token not set in redis!'));
            }
        });
    };

    this.delete = function (req) {
        var token = fetchToken(req);
        if (token) {
            client.expire(token, 0);
        }
    };

    this.clean = function () {
        client.flushdb();
    };
};

exports = module.exports = RedisBackend;