'use strict';

var Uuid = require('node-uuid'),
    Bcrypt = require('bcrypt'),
    Async = require('async');

exports = module.exports = function (app, mongoose) {
    var sessionSchema = new mongoose.Schema({
        userId: {
            type: String,
            required: true,
            default: ''
        },
        key: {
            type: String,
            required: true,
            default: ''
        },
        time: {
            type: Date,
            default: Date.now
        }
    });

    sessionSchema.statics.generateKeyHash = function (callback) {

        var key = Uuid.v4();

        Async.auto({
            salt: function (done) {

                Bcrypt.genSalt(10, done);
            },
            hash: ['salt', function (done, results) {

                Bcrypt.hash(key, results.salt, done);
            }]
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            callback(null, {
                key: key,
                hash: results.hash
            });
        });
    };

    sessionSchema.statics.create = function (userId, callback) {

        Async.auto({
            keyHash: this.generateKeyHash.bind(this),
            newSession: ['keyHash', function (done, results) {

                var document = {
                    userId: userId,
                    key: results.keyHash.hash,
                    time: new Date()
                };

                var SessionModel = app.db.model('session');
                var session = new SessionModel(document);
                session.save(function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    done(null, result);
                });
            }],
            clean: ['newSession', function (done, results) {

                var query = {
                    userId: userId,
                    key: {$ne: results.keyHash.hash}
                };

                var SessionModel = app.db.model('session');
                SessionModel.findOneAndRemove(query, done);
            }]
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            results.newSession.key = results.keyHash.key;

            callback(null, results.newSession);
        });
    };

    sessionSchema.statics.findByCredentials = function (id, key, callback) {


        Async.auto({
            session: function (done) {

                app.db.model('session').findById(id, done);
            },
            keyMatch: ['session', function (done, results) {

                if (!results.session) {
                    return done(null, false);
                }

                var source = results.session.key;
                Bcrypt.compare(key, source, done);
            }]
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            if (results.keyMatch) {
                return callback(null, results.session);
            }

            callback();
        });
    };

    sessionSchema.index({'user.id': 1});
    sessionSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('session', sessionSchema);
}