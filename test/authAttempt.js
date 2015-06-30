'use strict';

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var config = require('../config-example');
var app = {
    get: function (str) {
        return '';
    }
};

var authAttempt;

describe('Auth-attempt model validations', function () {

    before(function (done) {

        app.db = mongoose.createConnection(config.mongodb.uri + '_tests');
        require('../schema/authAttempt')(app, mongoose);
        authAttempt = app.db.model('authAttempt');
        authAttempt.remove({}, function (err) { });
        done();
    });

    it('should return a new instance when create succeeds', function (done) {

        authAttempt.create('0.0.0.0', 'username', function (err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(authAttempt);

            done();
        });
    });
});