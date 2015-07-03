'use strict';

var should = require('should');
var mongoose = require('mongoose');
var app = {
    config: require('../config-example'),
    get: function (str) {
        return '';
    }
};

var user;

describe('User  model validations', function () {
    // within before() you can run all the operations that are needed to setup your tests. In this case
    // I want to create a connection with the database, and when I'm done, I call done().
    before(function (done) {
        // In our tests we use the test db
        app.db = mongoose.createConnection(app.config.mongodb.uri + '_tests');
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

    it('should return a new instance when create succeeds', function (done) {
        user.register(new user({
            username: 'username',
            email: 'usermail@mail.com'
        }), 'user_password', function(err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(user);

            done();
        });
    });

    // Username checking

    it('should alert about duplicated user names', function (done) {
        user.register(new user({
            username: 'username',
            email: 'email@m.com'
        }), 'user_password2', function(err, result) {
            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done();
        });
    });

    it('should alert about missing username', function (done) {
        user.register(new user({
            email: 'email@m.com'
        }), 'user_password23', function(err, result) {

            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done()
        });
    });


    // Email checking

    it('should alert about missing email', function (done) {
        user.register(new user({
            username: 'username23'
        }), 'user_password23', function(err, result) {

            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done();
        });
    });

    it('should return an error when we provide an invalid email', function (done) {
        user.register(new user({
            username: 'username2',
            email: 'invalid_mail'
        }), 'user_password2', function(err, result) {

            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done();
        });
    });

});