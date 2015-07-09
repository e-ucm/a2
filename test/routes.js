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

    var get = function (url, token, exprectedCode, callback) {
        request.get(url).set('Authorization', 'Bearer ' + token).expect(exprectedCode).end(callback);
    };

    var post = function (url, data, exprectedCode, callback) {
        request.post(url).send(data).expect(exprectedCode).end(callback);
    };

    var authPost = function (url, token, data, exprectedCode, callback) {
        request.post(url).set('Authorization', 'Bearer ' + token).send(data).expect(exprectedCode).end(callback);
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
            }, 401, done);
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
                token = res.user.token;
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
            get(usersRoute, token, 200, function(err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                res = JSON.parse(res.text);

                // data validation
                var data = res.data;
                should(data).be.an.Array();
                if(data.length > 0) {
                    // user validation
                    var user = data[0];
                    should(user).be.an.Object();
                    should(user._id).be.a.String();
                    should(user.username).be.a.String();
                    should(user.email).be.a.String();
                    should(user.timeCreated).be.a.String();
                    should(user.verification).be.an.Object();
                    should(user.verification.complete).be.a.Boolean();
                    should(user.name).be.an.Object();
                    should(user.name.first).be.a.String();
                    should(user.name.middle).be.a.String();
                    should(user.name.last).be.a.String();
                }

                // pages validation
                should(res.pages).be.an.Object();
                should(res.pages.current).be.a.Number();
                should(res.pages.prev).be.a.Number();
                should(res.pages.hasPrev).be.a.Boolean();
                should(res.pages.next).be.a.Number();
                should(res.pages.hasNext).be.a.Boolean();
                should(res.pages.total).be.a.Number();

                // items validation
                should(res.items).be.an.Object();
                should(res.items.limit).be.a.Number();
                should(res.items.begin).be.a.Number();
                should(res.items.end).be.a.Number();
                should(res.items.total).be.a.Number();
                done();
            });
        });
    });

    /** /api/roles **/
    var rolesRoute = '/api/roles';

    describe(rolesRoute, function () {

        it('should not GET roles because of an invalid_token', function (done) {
            get(rolesRoute, 'invalid_token', 401, done);
        });

        it('should correctly GET roles', function (done) {

            get(rolesRoute, token, 200, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                done();
            });
        });
    });

    var role1 = {
        "roles": "role1",
        "allows": [
            {"resources": "resource-1", "permissions": ["permission-1", "permission-3"]},
            {"resources": ["resource-2", "resource-3"], "permissions": ["permission-2"]}
        ]
    };
    var role2 = {
        "roles": "role2",
        "resources": [
            "resource-1",
            "resource-2",
            "resource-3"
        ],
        "permissions": [
            "permission-1",
            "permission-2",
            "permission-3"
        ]
    };
    describe(rolesRoute, function () {

        it('should not POST role because of an invalid_token', function (done) {
            post(rolesRoute, 'invalid_token', 401, done);
        });

        it('should not POST role, bad fields', function (done) {
            var wrongRole1 = {
                "name": "role name",
                "allows": [
                    {"resources": "resource-1", "permissions": ["permission-1", "permission-3"]},
                    {"resources": ["resource-2", "resource-3"], "permissions": ["permission-2"]}
                ]
            };

            authPost(rolesRoute, token, wrongRole1, 400, done);
        });

        it('should not POST role, bad fields', function (done) {
            var wrongRole2 = {
                "roles": "bad role",
            };

            authPost(rolesRoute, token, wrongRole2, 400, done);
        });

        it('should correctly POST role1', function (done) {

            authPost(rolesRoute, token, role1, 200, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                should(res).containDeep([role1.roles])
                done();
            });
        });

        it('should correctly POST role2', function (done) {

            authPost(rolesRoute, token, role2, 200, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                should(res).containDeep([role2.roles])
                done();
            });
        });

        it('should not POST role, the role already exists.', function (done) {
            authPost(rolesRoute, token, role1, 400, done);
        });
    });
});
