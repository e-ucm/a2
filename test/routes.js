'use strict';

var should = require('should');
var request = require('supertest');
var config = require('../config-example');
var app = require('../app.js');

var port = 3333;

var GET = 'GET ',
    POST = 'POST ',
    PUT = 'PUT ',
    DEL = 'DEL ';

var admin = {
    id: "",
    username: "admin",
    password: "123",
    email: "adminemail@comp.ink",
    token: ""
};

var user = {
    id: "",
    username: "user_asd",
    password: "12321",
    email: "useremail@comp.ink",
    token: ""
};

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
        app.tokenStorage.clean();
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
    };

    var authPut = function (url, token, data, exprectedCode, callback) {
        request.put(url).set('Authorization', 'Bearer ' + token).send(data).expect(exprectedCode).end(callback);
    };

    var del = function (url, token, exprectedCode, callback) {
        request.delete(url).set('Authorization', 'Bearer ' + token).expect(exprectedCode).end(callback);
    };

    var delWithData = function (url, token, data, exprectedCode, callback) {
        request.delete(url).set('Authorization', 'Bearer ' + token).send(data).expect(exprectedCode).end(callback);
    };

    var validateUser = function (user) {
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
    };

    /** /api/signup **/
    var signupRoute = '/api/signup';

    describe(POST + signupRoute, function () {
        it('should not signUp correctly if the username is missing', function (done) {
            post(signupRoute, {
                "password": admin.password,
                "email": admin.email
            }, 400, done);
        });

        it('should not signUp correctly if the password is missing', function (done) {
            post(signupRoute, {
                "username": admin.username,
                "email": admin.email
            }, 400, done);
        });

        it('should not signUp correctly if the email is missing', function (done) {
            post(signupRoute, {
                "username": admin.username,
                "password": admin.password
            }, 400, done);
        });

        it('should signUp correctly', function (done) {
            post(signupRoute, {
                "username": admin.username,
                "password": admin.password,
                "email": admin.email
            }, 200, function (err, res) {
                should.not.exist(err);
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                should(res.user).be.an.Object();
                should(res.user.id).be.an.String();
                should(res.user.username).be.an.String();
                should.equal(res.user.username, admin.username);
                should(res.user.email).be.an.String();
                should.equal(res.user.email, admin.email);
                app.acl.addUserRoles(admin.username, 'admin', function (err) {
                    should.not.exist(err);
                    post(signupRoute, {
                        "username": user.username,
                        "password": user.password,
                        "email": user.email
                    }, 200, done);
                });
            });
        });

        /** /api/login **/
        var loginRoute = '/api/login';

        describe(POST + loginRoute, function () {
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

                var adminLoginData = {
                    "username": admin.username,
                    "password": admin.password
                };

                post(loginRoute, adminLoginData, 200, function (err, res) {
                    should.not.exist(err);
                    should(res).be.an.Object();
                    res = JSON.parse(res.text);
                    should(res.user).be.an.Object();
                    should(res.user.id).be.a.String();
                    should(res.user.username).be.a.String();
                    should(res.user.email).be.a.String();
                    should(res.user.token).be.a.String();
                    admin.token = res.user.token;
                    admin.id = res.user.id;
                    post(loginRoute, {
                        "username": user.username,
                        "password": user.password
                    }, 200, function (err, res) {
                        res = JSON.parse(res.text);

                        user.token = res.user.token;
                        user.id = res.user.id;
                        done();
                    });
                });
            });
        });

        /** /api/users **/
        var usersRoute = '/api/users';

        describe(GET + usersRoute, function () {

            it('should not GET users with an invalid_token', function (done) {
                get(usersRoute, 'invalid_token', 401, done);
            });

            it('should not GET users with an unauthorized token', function (done) {
                get(usersRoute, user.token, 403, done);
            });

            it('should correctly GET users', function (done) {
                get(usersRoute, admin.token, 200, function (err, res) {
                    should.not.exist(err);
                    should(res).be.an.Object();

                    res = JSON.parse(res.text);

                    // data validation
                    var data = res.data;
                    should(data).be.an.Array();
                    if (data.length > 0) {
                        // user validation
                        var user = data[0];
                        validateUser(user);
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

        /** /api/users/:userId **/

        var name = {
            "first": "testFirst",
            "middle": "testMiddle",
            "last": "testLast",
        };

        describe(GET + usersRoute + '/:userId', function () {

            it('should not GET a specific user with an invalid_token', function (done) {
                get(usersRoute + '/' + admin.id, 'invalid_token', 401, done);
            });

            it('should not GET a specific user with an unauthorized token', function (done) {
                get(usersRoute + '/' + admin.id, user.token, 403, done);
            });

            var validateUserInformation = function (id, username, email, done) {
                return function (err, res) {
                    should.not.exist(err);
                    should(res).be.an.Object();

                    var user = JSON.parse(res.text);

                    validateUser(user);
                    should.equal(user._id, id);
                    should.equal(user.username, username);
                    should.equal(user.email, email);
                    done();
                };
            };

            it('should GET its own user information', function (done) {
                get(usersRoute + '/' + user.id, user.token, 200, validateUserInformation(user.id, user.username, user.email, done));
            });

            it('should GET its own admin information', function (done) {
                get(usersRoute + '/' + admin.id, admin.token, 200, validateUserInformation(admin.id, admin.username, admin.email, done));
            });

            it('should GET a specific user that its not his own information', function (done) {
                get(usersRoute + '/' + user.id, admin.token, 200, validateUserInformation(user.id, user.username, user.email, done));
            });
        });

        describe(PUT + usersRoute + '/:userId', function () {

            it("should not PUT a specific user's name with an invalid_token", function (done) {
                authPut(usersRoute + '/' + admin.id, 'invalid_token', name, 401, done);
            });

            it("should not PUT a specific user's name with an unauthorized token", function (done) {
                authPut(usersRoute + '/' + admin.id, user.token, name, 403, done);
            });

            var validateNameInformation = function (nameData, done) {
                return function (err, res) {
                    should.not.exist(err);
                    should(res).be.an.Object();

                    var user = JSON.parse(res.text);

                    validateUser(user);
                    should(user.name.first).equal(nameData.first);
                    should(user.name.middle).equal(nameData.middle);
                    should(user.name.last).equal(nameData.last);

                    done();
                };
            };

            it("should PUT its own user name", function (done) {
                authPut(usersRoute + '/' + user.id, user.token, name, 200, validateNameInformation(name, done));
            });

            it("should PUT its own admin name", function (done) {
                authPut(usersRoute + '/' + admin.id, admin.token, name, 200, validateNameInformation(name, done));
            });

            it("should PUT a specific user name that is not his own", function (done) {
                name.first += name.first;
                name.middle += name.middle;
                name.last += name.last;
                authPut(usersRoute + '/' + user.id, admin.token, name, 200, validateNameInformation(name, done));
            });
        });

        describe(DEL + usersRoute + '/:userId', function () {

            var validateDeletedUser = function (username, done) {
                return function (err, res) {
                    should.not.exist(err);
                    should(res).be.an.Object();

                    res = JSON.parse(res.text);
                    should(res.message).be.a.String();

                    app.db.model('user').findByUsername(username, function (error, user) {
                        should.not.exist(error);
                        should.not.exist(user);
                        done();
                    });
                };
            };

            it('should DELETE an user correctly with an authorized token', function (done) {
                post(signupRoute, {
                    "username": "testUser1",
                    "password": "testUser1Pw",
                    "email": "testUser1Pw@comp.ink"
                }, 200, function (err, res) {
                    should.not.exist(err);
                    var result = JSON.parse(res.text);

                    del(usersRoute + '/' + result.user.id, 'invalid_token', 401, function (err, res) {
                        should.not.exist(err);

                        del(usersRoute + '/' + result.user.id, admin.token, 200,
                            validateDeletedUser(result.user.username, done));
                    });
                });
            });

            it('should DELETE himself', function (done) {
                post(signupRoute, {
                    "username": "testUser1",
                    "password": "testUser1Pw",
                    "email": "testUser1Pw@comp.ink"
                }, 200, function (err, res) {
                    should.not.exist(err);
                    var result = JSON.parse(res.text);

                    post(loginRoute, {
                        "username": "testUser1",
                        "password": "testUser1Pw"
                    }, 200, function (err, res) {
                        res = JSON.parse(res.text);
                        var testUserToken = res.user.token;
                        del(usersRoute + '/' + result.user.id, testUserToken, 200,
                            validateDeletedUser(result.user.username, done));
                    });
                });
            });
        });

        /** /api/users/:userId/roles **/

        describe(GET + usersRoute + '/:userId/roles', function () {

            it('should not GET a specific user roles with an invalid_token', function (done) {
                get(usersRoute + '/' + admin.id + '/roles', 'invalid_token', 401, done);
            });

            it('should not GET a specific user roles with an unauthorized token', function (done) {
                get(usersRoute + '/' + admin.id + '/roles', user.token, 403, done);
            });

            var validateRolesInformation = function (done) {
                return function (err, res) {
                    should.not.exist(err);
                    should(res).be.an.Object();

                    var roles = JSON.parse(res.text);

                    should(roles).be.an.Array();

                    if (roles.length > 0) {
                        should(roles[0]).be.a.String();
                    }

                    done();
                };
            };

            it("should not GET his own when it has none", function (done) {
                get(usersRoute + '/' + user.id + '/roles', user.token, 403, done);
            });

            it("should GET his own roles being an admin", function (done) {
                get(usersRoute + '/' + admin.id + '/roles', admin.token, 200, validateRolesInformation(done));
            });

            it("should GET a specific user's roles being authorized (admin)", function (done) {
                get(usersRoute + '/' + user.id + '/roles', admin.token, 200, validateRolesInformation(done));
            });
        });


        describe(POST + usersRoute + '/:userId/roles', function () {
            var newRoles = ['role1', 'role2', 'role3'];

            it("should not POST roles to an user with an invalid token", function (done) {
                authPost(usersRoute + '/' + admin.id + '/roles', 'invalid_token', newRoles, 401, done);
            });

            it("should not POST roles to himself with an unauthorized token", function (done) {
                authPost(usersRoute + '/' + user.id + '/roles', user.token, newRoles, 403, done);
            });

            it("should not POST roles to an user with an unauthorized token", function (done) {
                authPost(usersRoute + '/' + admin.id + '/roles', user.token, newRoles, 403, done);
            });

            var validatePOSTroles = function (newRoles, done) {
                return function (err, res) {
                    should.not.exist(err);
                    should(res).be.an.Object();

                    var result = JSON.parse(res.text);
                    should(result.message).be.a.String();

                    get(usersRoute + '/' + admin.id + '/roles', admin.token, 200, function (err, res) {

                        var roles = JSON.parse(res.text);

                        should(roles).containDeep(newRoles);

                        done();
                    });
                };
            };

            it("should POST roles to himself being authorized", function (done) {
                authPost(usersRoute + '/' + admin.id + '/roles', admin.token, newRoles, 200,
                    validatePOSTroles(newRoles, done));
            });

            it("should POST roles to a specific user being authorized (admin)", function (done) {
                authPost(usersRoute + '/' + user.id + '/roles', admin.token, newRoles, 200,
                    validatePOSTroles(newRoles, done));
            });
        });

        describe(DEL + usersRoute + '/:userId/roles', function () {
            var deletedRoles = ['role2', 'role3'];

            it("should not DELETE roles from an user with an invalid token", function (done) {
                delWithData(usersRoute + '/' + admin.id + '/roles', 'invalid_token', deletedRoles, 401, done);
            });

            it("should not DELETE roles from an user with an unauthorized token", function (done) {
                delWithData(usersRoute + '/' + admin.id + '/roles', user.token, deletedRoles, 403, done);
            });

            it("should not DELETE roles himself with an unauthorized token", function (done) {
                delWithData(usersRoute + '/' + user.id + '/roles', user.token, deletedRoles, 403, done);
            });

            var validateDELroles = function (deletedRoles, id, done) {
                return function (err, res) {
                    should.not.exist(err);
                    should(res).be.an.Object();

                    var result = JSON.parse(res.text);
                    should(result.message).be.a.String();

                    get(usersRoute + '/' + id + '/roles', admin.token, 200, function (err, res) {

                        var roles = JSON.parse(res.text);

                        should(roles).not.containDeep(deletedRoles);

                        done();
                    });
                };
            };

            it("should DELETE roles from a specific user being authorized", function (done) {
                delWithData(usersRoute + '/' + user.id + '/roles', admin.token, deletedRoles, 200,
                    validateDELroles(deletedRoles, user.id, done));
            });

            it("should DELETE roles from himself being authorized (admin)", function (done) {
                delWithData(usersRoute + '/' + admin.id + '/roles', admin.token, deletedRoles, 200,
                    validateDELroles(deletedRoles, admin.id, done));
            });

            it("shouldn't DELETE the admin role from himself", function (done) {
                delWithData(usersRoute + '/' + admin.id + '/roles', admin.token, ['admin'], 403, done);
            });
        });

        /** /api/roles **/
        var rolesRoute = '/api/roles';

        describe(rolesRoute, function () {

            it('should not GET roles because of an invalid_token', function (done) {
                get(rolesRoute, 'invalid_token', 401, done);
            });

            it('should correctly GET roles', function (done) {

                get(rolesRoute, admin.token, 200, function (err, res) {
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

                authPost(rolesRoute, admin.token, wrongRole1, 400, done);
            });

            it('should not POST role, bad fields', function (done) {
                var wrongRole2 = {
                    "roles": "bad role",
                };

                authPost(rolesRoute, admin.token, wrongRole2, 400, done);
            });

            it('should correctly POST role1', function (done) {

                authPost(rolesRoute, admin.token, role1, 200, function (err, res) {
                    res = JSON.parse(res.text);
                    should(res).be.an.Array();
                    should(res).containDeep([role1.roles])
                    done();
                });
            });

            it('should correctly POST role2', function (done) {

                authPost(rolesRoute, admin.token, role2, 200, function (err, res) {
                    res = JSON.parse(res.text);
                    should(res).be.an.Array();
                    should(res).containDeep([role2.roles])
                    done();
                });
            });

            it('should not POST role, the role already exists.', function (done) {
                authPost(rolesRoute, admin.token, role1, 400, done);
            });
        });
    });
});
