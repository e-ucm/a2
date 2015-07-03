'use strict';

exports = module.exports = function (app, mongoose) {
    require('./schema/user')(app, mongoose);
};
