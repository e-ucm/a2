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
    bcrypt: {}
};

var session;

describe('Session model validations', function () {
    
    before(function (done) {
        app.db = mongoose.createConnection(config.mongodb.uri + '_tests');
        require('../schema/session')(app, mongoose);
        session = app.db.model('session');
        session.remove({}, function (err) { });
        done();
    });

    it('should create a key hash combination', function (done) {

        session.generateKeyHash(function (err, result) {
            
            should.not.exist(err);
            should(result).be.an.Object;
            should(result.key).be.a.String;
            should(result.hash).be.a.String;

            done();
        });
    });

    it('should return a new instance when create succeeds', function (done) {

        session.create('ren', function (err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(session);

            done();
        });
    });
});