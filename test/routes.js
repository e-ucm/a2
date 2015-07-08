var should = require('should');
var request = require('supertest');
var config = require('../config-example');
var app = require('../app.js');

var port = 3333;

var token = "";
var adminName = "admin";
var adminPw = "123";

describe('REST API', function () {

    /** config **/

    before(function (done) {
        app.listen(port, function (err, result) {
            if (err) {
                done(err);
            } else {
                app.db.model('user').remove({}, function (err) {
                    done(err);
                });
            }
        });
    });
    request = request(app);

    after(function () {
        app.db.db.dropDatabase();
    });

    it('should exist', function (done) {
        should.exist(app);
        done();
    });

    var post = function (url, data, exprectedCode, callback) {
        request.post(url).send(data).expect(exprectedCode).end(callback);
    }

    var get = function (url, token, exprectedCode, callback) {
        request.get(url).set('Authorization', 'Bearer ' + token).expect(exprectedCode).end(callback);
    }

    /** /api/signup **/
    var signupRoute = '/api/signup';

    describe(signupRoute, function () {
        it('should not signUp correctly if the username is missing', function (done) {
            post(signupRoute, {
                "password": adminPw,
                "email": "adminemail@comp.ink"
            }, 400, done);
        });

        it('should not signUp correctly if the password is missing', function (done) {
            post(signupRoute, {
                "username": adminName,
                "email": "adminemail@comp.ink"
            }, 400, done);
        });

        it('should not signUp correctly if the email is missing', function (done) {
            post(signupRoute, {
                "username": adminName,
                "password": adminPw
            }, 400, done);
        });

        it('should signUp correctly', function (done) {
            post(signupRoute, {
                "username": adminName,
                "password": adminPw,
                "email": "adminemail@comp.ink"
            }, 200, function (err, res) {
                should.not.exist(err);
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                should(res.user).be.an.Object();
                should(res.user.id).be.an.String();
                should(res.user.username).be.an.String();
                should(res.user.email).be.an.String();
                app.acl.addUserRoles(adminName, 'admin', done);
            });
        });
    });

    /** /api/login **/
    var loginRoute = '/api/login';

    describe(loginRoute, function () {
        it('should return a 401 status code if no login data is provided', function (done) {
            post(loginRoute, {}, 401, done);
        });

        it('should return a 401 status code if the credentials are incorrect', function (done) {
            post(loginRoute, {
                "username": "asdsdf",
                "password": "dsgfsdfg"
            }, 401, function (err, res) {
                should.not.exist(err);
                done();
            });
        });

        it('should login correctly', function (done) {

            var loginData = {
                "username": adminName,
                "password": adminPw
            };

            post(loginRoute, loginData, 200, function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();
                res = JSON.parse(res.text);
                should(res.user).be.an.Object();
                should(res.user.id).be.an.String();
                should(res.user.username).be.a.String();
                should(res.user.email).be.a.String();
                should(res.user.token).be.a.String();
                token = res.token;
                done();
            });
        });
    });

    /** /api/users **/
    var usersRoute = '/api/users';

    describe(usersRoute, function () {

        it('should not GET users because of an invalid_token', function (done) {
            get(usersRoute, 'invalid_token', 401, done);
        });


        it('should correctly GET users', function (done) {
            get(usersRoute, token, 401, done);
        });
    });
});
