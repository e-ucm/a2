'use strict';

var Async = require('async');
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
    admin_group: {}
};

var admin;

describe('Admin model validations', function () {
    
    before(function (done) {
        app.db = mongoose.createConnection(config.mongodb.uri + '_tests');
        require('../schema/admin')(app, mongoose);
        admin = app.db.model('admin');
        admin.remove({}, function (err) { });
        done();
    });

    it('should a new instance when create succeeds', function (done) {

        admin.create(mongoose.Types.ObjectId(), 'username1', 'Jack Sparrow', function (err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(admin);

            done();
        });
    });

    it('correctly sets the middle name when create is called', function (done) {

		admin.create(mongoose.Types.ObjectId(), 'username2','Bruce D Mc', function (err, result) {

            should.not.exist(err);
            should(result).be.an.instanceOf(admin);
            should(result.name.middle).equal('D');

            done();
        });
    });

    it('should return a result when finding by username', function (done) {

        Async.auto({
            createAdmin: function (cb) {

                admin.create(mongoose.Types.ObjectId(), 'username3', 'Ren Höek', cb);
            },
            adminUpdated: ['createAdmin', function (cb, results) {

                var fieldsToUpdate = {
                    $set: {
                        user: {
                            id: mongoose.Types.ObjectId(),
                            name: 'sara'
                        }
                    }
                };

                admin.findByIdAndUpdate(results.createAdmin._id, fieldsToUpdate, cb);
            }]
        }, function (err, results) {

            if (err) {
                return done(err);
            }

            admin.findByUsername('sara', function (err, result) {

                should.not.exist(err);
                should(result).be.an.instanceOf(admin);

                done();
            });
        });        
    });
});