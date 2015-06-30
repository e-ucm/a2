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
var stub = {
    Account: {},
    Admin: {},
    bcrypt: {}
};

var user;

describe('User  model validations', function () {
    // within before() you can run all the operations that are needed to setup your tests. In this case
    // I want to create a connection with the database, and when I'm done, I call done().
    before(function (done) {
        // In our tests we use the test db
        app.db = mongoose.createConnection(config.mongodb.uri + '_tests');
        require('../schema/user')(app, mongoose);
        user = app.db.model('user');
        user.remove({}, function (err) { });
        done();
    });

    // use describe to give a title to your test suite, in this case the tile is "Model validations"
    // and then specify a function in which we are going to declare all the tests
    // we want to run. Each test starts with the function it() and as a first argument
    // we have to provide a meaningful title for it, whereas as the second argument we
    // specify a function that takes a single parameter, "done", that we will use
    // to specify when our test is completed, and that's what makes easy
    // to perform async test!

    it('should create a password hash combination', function (done) {

        user.generatePasswordHash('bighouseblues', function (err, result) {

            should.not.exist(err);
            should.exist(result);
            should(result.password).be.a.String;
            should(result.hash).be.a.String;

            done();
        });
    });

    it('should return a new instance when create succeeds', function (done) {

        user.create('ren', 'bighouseblues', 'ren@stimpy.show', function (err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(user);

            done();
        });
    });
});