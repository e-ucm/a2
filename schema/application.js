'use strict';

exports = module.exports = function (app, mongoose) {
    var application = new mongoose.Schema({
        prefix: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
            trim: true
        },
        host: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
            validate: [require('validator').isURL, 'Invalid host! (must be an URL)']
        },
        name: {
            type: String
        },
        anonymous: [String],    // Anonymous(unprotected) routes defined by the application
        routes: [String],       // Protected routes defined by the application
        autoroles: [String],    // The roles that can be auto-assigned by the users when they create a new account
        timeCreated: {
            type: Date,
            default: Date.now
        }
    });

    application.statics.create = function (application, cb) {

        if (!application) {
            return cb(new Error('The application argument cannot be undefined!'));
        }

        if (!application.prefix) {
            return cb(new Error('The application must have a prefix attribute!'));
        }

        var Self = this;
        Self.findByPrefix(application.prefix, function (err, existingApplication) {

            if (err) {
                return cb(err);
            }

            if (existingApplication) {
                return cb(new Error('An application with the prefix ' + application.prefix + ' already exists!'));
            }

            // Create an instance of Self in case application isn't already an instance
            if (!(application instanceof Self)) {
                application = new Self(application);
            }

            application.save(function (err) {
                if (err) {
                    return cb(err);
                }

                cb(null, application);
            });
        });
    };

    application.statics.findByPrefix = function (prefix, cb) {
        var queryParameters = {};

        // Convert the prefix to lowercase
        if (prefix !== undefined) {
            prefix = prefix.toLowerCase();
        }

        queryParameters.prefix = prefix;

        var query = this.findOne(queryParameters);

        if (cb) {
            query.exec(cb);
        } else {
            return query;
        }
    };

    application.plugin(require('./plugins/pagedFind'));
    application.index({prefix: 1}, {unique: true});
    application.set('autoIndex', true);
    app.db.model('application', application);

};
