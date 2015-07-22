'use strict';

exports = module.exports = function (app) {

    var UserModel = app.db.model('user');
    app.passport.use('local', UserModel.createStrategy());
};
