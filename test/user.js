/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var should = require('should');
var mongoose = require('mongoose');
var app = {
    config: require('../config-test'),
    get: function (str) {
        return str;
    }
};

var User;

describe('User  model validations', function () {
    this.timeout(4000);
    // Within before() you can run all the operations that are needed to setup your tests. In this case
    // I want to create a connection with the database, and when I'm done, I call done().
    before(function (done) {
        // In our tests we use the test db
        app.db = mongoose.createConnection(app.config.mongodb.uri + '_tests');
        require('../schema/user')(app, mongoose);
        User = app.db.model('user');
        User.remove({}, function (err) {
            done(err);
        });
    });

    after(function () {
        app.db.db.dropDatabase();
    });

    // Use describe to give a title to your test suite, in this case the tile is "Model validations"
    // and then specify a function in which we are going to declare all the tests
    // we want to run. Each test starts with the function it() and as a first argument
    // we have to provide a meaningful title for it, whereas as the second argument we
    // specify a function that takes a single parameter, "done", that we will use
    // to specify when our test is completed, and that's what makes easy
    // to perform async test!

    it('should return a new instance when create succeeds', function (done) {
        User.register(new User({
            username: 'username',
            email: 'usermail@mail.com'
        }), 'user_password', function (err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(User);

            done();
        });
    });

    // Username checking

    it('should alert about duplicated user names', function (done) {
        User.register(new User({
            username: 'username',
            email: 'email@m.com'
        }), 'user_password2', function (err, result) {
            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done();
        });
    });

    it('should alert about missing username', function (done) {
        User.register(new User({
            email: 'email@m.com'
        }), 'user_password23', function (err, result) {

            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done();
        });
    });


    // Email checking

    it('should alert about duplicated user email', function (done) {
        User.register(new User({
            username: 'username234',
            email: 'usermail@mail.com'
        }), 'user_password2', function (err, result) {
            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done();
        });

    });

    it('should alert about missing email', function (done) {
        User.register(new User({
            username: 'username23'
        }), 'user_password23', function (err, result) {

            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done();
        });
    });

    it('should return an error when we provide an invalid email', function (done) {
        User.register(new User({
            username: 'username2',
            email: 'invalid_mail'
        }), 'user_password2', function (err, result) {

            should.not.exist(result);
            should(err).be.an.instanceOf(Error);
            done();
        });
    });

});