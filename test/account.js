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
    user: {},
    admin: {},
    bcrypt: {}
};

var account;

describe('Account model validations', function () {
    
    before(function (done) {
        app.db = mongoose.createConnection(config.mongodb.uri + '_tests');
        require('../schema/account')(app, mongoose);
        account = app.db.model('account');
        account.remove({}, function (err) { });
        done();
    });

    it('should a new instance when create succeeds', function (done) {

		account.create(mongoose.Types.ObjectId(), 'username1', 'Jack Sparrow', function (err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(account);

            done();
        });
    });

    it('correctly sets the middle name when create is called', function (done) {

		account.create(mongoose.Types.ObjectId(), 'username2','Bruce C Mc', function (err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(account);
            should(result.name.middle).equal('C');

            done();
        });
    });
});