'use strict';

var request = require('supertest'),
    app = require('../app.js');

var config;

describe('API Test', function(done) {
    /**Initialize MongoDB**/
    before(function (done) {
        var app = require('../app');
        config = app.config;
        app.listen(config.port, function (err) {
            if (err) {
                done(err);
            } else {
                request = request(app);
                // Give it 200ms so that the connection with MongoDB is established.
                setTimeout(function () {
                    done();
                }, 200);
            }
        });
    });

    it('Start tests', function(done) {
        require('./tests/health')(request);
        require('./tests/login')(request, app);
        done();
    });

});

