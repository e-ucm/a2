'use strict';

exports = module.exports = function(app, passport) {
    var LocalStrategy = require('passport-local').Strategy;

    passport.use('local', new LocalStrategy(
        function (username, password, done) {
            app.db.model('user').findByCredentials(username, password, done);
        }
    ));

    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        app.db.model('user').findOne({ _id: id }).populate('roles.admin').populate('roles.account').exec(function(err, user) {
            if (user && user.roles && user.roles.admin) {
                user.roles.admin.populate("groups", function(err, admin) {
                    done(err, user);
                });
            }
            else {
                done(err, user);
            }
        });
    });

}
