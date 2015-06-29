'use strict';

exports = module.exports = function (app, mongoose) {


    require('./schema/User')(app, mongoose);
    require('./schema/Account')(app, mongoose);
};
