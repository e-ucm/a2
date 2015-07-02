'use strict';

exports = module.exports = function (app) {

    var UserModel = app.db.model('user');
    app.passport.use('local', UserModel.createStrategy());
    app.passport.serializeUser(UserModel.serializeUser());
    app.passport.deserializeUser(UserModel.deserializeUser());
};
