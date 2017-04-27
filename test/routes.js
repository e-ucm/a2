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
var request = require('supertest');
var app = require('../app.js');

var port = 3333;

var SUCCESS = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403;

var GET = 'GET ',
    POST = 'POST ',
    PUT = 'PUT ',
    DEL = 'DEL ';

var admin = {
    _id: '',
    username: 'admin',
    password: '123',
    email: 'adminemail@comp.ink',
    token: ''
};

var user = {
    _id: '',
    username: 'user_asd',
    password: '12321',
    email: 'useremail@comp.ink',
    token: ''
};

var application = {
    _id: ''
};

describe('REST API', function () {
    this.timeout(4000);

    /** Config **/

    before(function (done) {
        app.listen(port, function (err) {
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

    var healthRoute = '/api/health';
    describe(GET + healthRoute, function () {
        it('should return status 200', function (done) {
            get(healthRoute, 'token', SUCCESS, function (err, res) {
                should.not.exist(err);
                done();
            });
        });
    });

    /** /api/signup **/
    var signupRoute = '/api/signup';

    describe(POST + signupRoute, function () {
        it('should not signUp correctly if the username is missing', function (done) {
            post(signupRoute, {
                password: admin.password,
                email: admin.email
            }, BAD_REQUEST, done);
        });

        it('should not signUp correctly if the password is missing', function (done) {
            post(signupRoute, {
                username: admin.username,
                email: admin.email
            }, BAD_REQUEST, done);
        });

        it('should not signUp correctly if the email is missing', function (done) {
            post(signupRoute, {
                username: admin.username,
                password: admin.password
            }, BAD_REQUEST, done);
        });

        it('should signUp correctly', function (done) {
            post(signupRoute, {
                username: admin.username,
                password: admin.password,
                email: admin.email
            }, SUCCESS, function (err, res) {
                should.not.exist(err);
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                should(res.user).be.an.Object();
                should(res.user._id).be.an.String();
                should(res.user.username).be.an.String();
                should.equal(res.user.username, admin.username);
                should(res.user.email).be.an.String();
                should.equal(res.user.email, admin.email);
                app.acl.addUserRoles(admin.username, 'admin', function (err) {
                    should.not.exist(err);
                    post(signupRoute, {
                        username: user.username,
                        password: user.password,
                        email: user.email
                    }, SUCCESS, done);
                });
            });
        });

        it('should signUp correctly (username to lowercase)', function (done) {
            var upperUsername = 'UPPER';
            var lowerUsername = upperUsername.toLowerCase();
            var email = 'test-email@mail.com';
            post(signupRoute, {
                username: upperUsername,
                password: 'someRandPassword',
                email: 'test-email@mail.com'
            }, SUCCESS, function (err, res) {
                should.not.exist(err);
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                should(res.user).be.an.Object();
                should(res.user._id).be.an.String();
                should(res.user.username).be.an.String();
                should.equal(res.user.username, lowerUsername);
                should(res.user.email).be.an.String();
                should.equal(res.user.email, email);
                done();
            });
        });
    });


    /** /api/login **/
    var loginRoute = '/api/login';

    describe(POST + loginRoute, function () {
        it('should return a UNAUTHORIZED status code if no login data is provided', function (done) {
            post(loginRoute, {}, UNAUTHORIZED, done);
        });

        it('should return a UNAUTHORIZED status code if the credentials are incorrect', function (done) {
            post(loginRoute, {
                username: 'asdsdf',
                password: 'dsgfsdfg'
            }, UNAUTHORIZED, done);
        });

        it('should login correctly', function (done) {

            var adminLoginData = {
                username: admin.username,
                password: admin.password
            };

            post(loginRoute, adminLoginData, SUCCESS, function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();
                res = JSON.parse(res.text);
                should(res.user).be.an.Object();
                should(res.user._id).be.a.String();
                should(res.user.username).be.a.String();
                should(res.user.email).be.a.String();
                should(res.user.token).be.a.String();
                admin.token = res.user.token;
                admin._id = res.user._id;
                post(loginRoute, {
                    username: user.username,
                    password: user.password
                }, SUCCESS, function (err, res) {
                    res = JSON.parse(res.text);

                    user.token = res.user.token;
                    user._id = res.user._id;
                    done();
                });
            });
        });
    });

    /** /api/signup/massive **/
    var signupRouteMassive = signupRoute + '/massive';
    var invalidUsers1 = { users: [] };
    var invalidUsers2 = { users: true };
    var badUser = { users: [{
        username: 'userBad',
        password: '12321'
    },
        {
            username: 'userGood',
            password: '12321',
            email: 'useremail1@comp.ink'
        }]
    };
    var users = { users: [{
        username: 'user_1',
        password: '12321',
        email: 'useremail1@comp.ink'
    },
        {
            username: 'user_2',
            password: '12321',
            email: 'useremail2@comp.ink'
        }]
    };
    describe(POST + signupRouteMassive, function () {
        it('should not signUp correctly if the users array is empty', function (done) {
            authPost(signupRouteMassive, user.token, invalidUsers1, BAD_REQUEST, done);
        });

        it('should not signUp correctly if the users is not an array', function (done) {
            authPost(signupRouteMassive, user.token, invalidUsers2, BAD_REQUEST, done);
        });

        it('should signUp correctly', function (done) {
            authPost(signupRouteMassive, user.token, users, SUCCESS, function (err, res) {
                should.not.exist(err);
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                should(res.errors).be.an.Array();
                should.equal(res.errorCount, 0);
                done();
            });
        });

        it('should not signUp correctly an user if doesn\'t have email but should signup the others', function (done) {
            authPost(signupRouteMassive, user.token, badUser, SUCCESS, function (err, res) {
                should.not.exist(err);
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                should(res.errors).be.an.Array();
                (0).should.be.below(res.errorCount);
                done();
            });
        });
    });

    var validatePages = function (pages) {
        should(pages).be.an.Object();
        should(pages.current).be.a.Number();
        should(pages.prev).be.a.Number();
        should(pages.hasPrev).be.a.Boolean();
        should(pages.next).be.a.Number();
        should(pages.hasNext).be.a.Boolean();
        should(pages.total).be.a.Number();
    };

    var validateItems = function (items) {
        should(items).be.an.Object();
        should(items.limit).be.a.Number();
        should(items.begin).be.a.Number();
        should(items.end).be.a.Number();
        should(items.total).be.a.Number();
    };

    /** /api/applications **/
    var applicationsRoute = '/api/applications';

    var validateApplication = function (application) {
        should(application).be.an.Object();
        should(application._id).be.a.String();
        should(application.host).be.a.String();
        should(application.prefix).be.a.String();
        should(application.timeCreated).be.a.String();
        should(application.name).be.a.String();
    };
    var gleanerPort = 3309;
    var gleanerPrefix = 'gleaner';
    var gleanerHost = 'localhost:' + gleanerPort;
    var anonymousRoute = '/anonymousRoute';
    var role = 'gleanerUser';
    var gleanerRoles = [
        {
            roles: role,
            allows: [
                {
                    resources: [
                        '/route1'
                    ],
                    permissions: [
                        'post',
                        'get',
                        'delete',
                        'put'
                    ]
                }
            ]
        }];

    describe(POST + applicationsRoute, function () {

        it('should not POST an application correctly with an unauthorized token', function (done) {
            authPost(applicationsRoute, user.token, {
                prefix: 'test-prefix',
                host: 'test-host'
            }, FORBIDDEN, done);
        });

        it('should not POST an application correctly if the prefix is missing', function (done) {
            authPost(applicationsRoute, admin.token, {
                host: 'test-host'
            }, BAD_REQUEST, done);
        });

        it('should not POST an application correctly if the host is missing', function (done) {
            authPost(applicationsRoute, admin.token, {
                prefix: 'test-prefix'
            }, BAD_REQUEST, done);
        });

        it('should POST an application correctly', function (done) {
            var appData = {
                prefix: gleanerPrefix,
                host: gleanerHost + '2',
                roles: gleanerRoles,
                autoroles: [role],
                anonymous: [anonymousRoute]
            };
            authPost(applicationsRoute, admin.token, appData, SUCCESS, function (err, res) {
                should.not.exist(err);
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                should(res._id).be.an.String();
                should(res.name).equal('');
                should(res.prefix).be.an.String();
                should.equal(res.prefix, appData.prefix);
                should(res.host).be.an.String();
                should(res.host).equal(gleanerHost + '2');
                should.equal(res.host, appData.host);
                should.equal(res.owner, admin.username);

                application._id = res._id;

                appData.host = gleanerHost;
                // Check if the application's host value is correctly updated
                authPost(applicationsRoute, admin.token, appData, SUCCESS, function (err, res) {
                    should.not.exist(err);
                    res = JSON.parse(res.text);
                    should(res).be.an.Object();
                    should(res._id).be.an.String();
                    should(res.name).equal('');
                    should(res.prefix).be.an.String();
                    should.equal(res.prefix, appData.prefix);
                    should(res.host).be.an.String();
                    should(res.host).equal(gleanerHost);
                    should.equal(res.host, appData.host);
                    should.equal(res.owner, admin.username);

                    app.acl.addUserRoles(user.username, 'gleanerUser', function (err) {
                        should.not.exist(err);

                        var usernameFromPrefixUpperCase = 'TEST223';
                        var mail = usernameFromPrefixUpperCase + '@email.com';
                        post(signupRoute, {
                            username: usernameFromPrefixUpperCase,
                            password: 'somePwd',
                            email:  mail,
                            prefix: appData.prefix,
                            role: role
                        }, SUCCESS, function (err, res) {
                            should.not.exist(err);
                            res = JSON.parse(res.text);
                            should(res).be.an.Object();
                            should(res.user).be.an.Object();
                            should(res.user._id).be.an.String();
                            should(res.user.username).be.an.String();
                            should.equal(res.user.username, usernameFromPrefixUpperCase.toLowerCase());
                            should(res.user.email).be.an.String();
                            should.equal(res.user.email, mail.toLowerCase());
                            app.acl.hasRole(usernameFromPrefixUpperCase, role,  function (err) {
                                should.not.exist(err);

                                get(usersRoute + '/' + user._id + '/roles', user.token, SUCCESS, validateRolesInformation(done));
                            });
                        });
                    });
                });
            });
        });
    });

    // Register new user with role gleanerUser
    describe(POST + signupRoute, function () {
        var user = 'user';
        it('should not signUp correctly if the role doesn\'t exist', function (done) {
            post(signupRoute, {
                username: user,
                password: 'pass',
                email: 'email@email.com',
                prefix: gleanerPrefix,
                role: 'invalidRole'
            }, 404, done);
        });

        it('should not signUp correctly if the role is admin', function (done) {
            post(signupRoute, {
                username: user,
                password: 'pass',
                email: 'email@email.com',
                prefix: gleanerPrefix,
                role: 'admin'
            }, FORBIDDEN, done);
        });

        it('should not signUp correctly if the application with the prefix doesn\'t exist', function (done) {
            post(signupRoute, {
                username: user,
                password: 'pass',
                email: 'email@email.com',
                prefix: 'invalidPrefix',
                role: role
            }, 404, done);
        });

        it('should not signUp correctly without a application prefix', function (done) {
            post(signupRoute, {
                username: user,
                password: 'pass',
                email: 'email@email.com',
                role: 'invalidRole'
            }, BAD_REQUEST, done);
        });

        it('should signUp correctly', function (done) {
            post(signupRoute, {
                username: user,
                password: 'pass',
                email: 'email@email.com',
                prefix: gleanerPrefix,
                role: role
            }, SUCCESS, function (err, res) {
                should.not.exist(err);
                app.acl.hasRole(user, role, function (err, hasRole) {
                    should.not.exist(err);
                    should.equal(hasRole, true);
                    done();
                });
            });
        });
    });

    describe(GET + applicationsRoute, function () {

        it('should not GET applications with an invalid_token', function (done) {
            get(applicationsRoute, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET applications with an unauthorized token', function (done) {
            get(applicationsRoute, user.token, FORBIDDEN, done);
        });

        it('should correctly GET applications', function (done) {
            get(applicationsRoute, admin.token, SUCCESS, function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                res = JSON.parse(res.text);

                // Data validation
                var data = res.data;
                should(data).be.an.Array();
                if (data.length > 0) {
                    // Application validation
                    var app = data[0];
                    validateApplication(app);
                }

                // Pages validation
                validatePages(res.pages);

                // Items validation
                validateItems(res.items);
                done();
            });
        });
    });

    /** /api/applications/:applicationId **/

    describe(GET + applicationsRoute + '/:applicationId', function () {

        it('should not GET a specific application with an invalid_token', function (done) {
            get(applicationsRoute + '/' + application._id, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET a specific application with an unauthorized token', function (done) {
            get(applicationsRoute + '/' + application._id, user.token, FORBIDDEN, done);
        });

        var validateApplicationInformation = function (id, done) {
            return function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                var app = JSON.parse(res.text);

                validateApplication(app);
                should.equal(app._id, id);
                done();
            };
        };

        it('should GET a specific application with an authorized token', function (done) {
            get(applicationsRoute + '/' + application._id, admin.token, SUCCESS,
                validateApplicationInformation(application._id, done));
        });
    });

    describe(PUT + applicationsRoute + '/:applicationId', function () {

        var testApplication = {
            _id: ''
        };

        var applicationName = {
            name: 'Gleaner App. (test)'
        };

        it('should not PUT a specific application\'s name with an invalid_token', function (done) {
            authPut(applicationsRoute + '/' + application._id, 'invalid_token', applicationName, UNAUTHORIZED, done);
        });

        it('should not PUT a specific application\'s name with an unauthorized token', function (done) {
            authPut(applicationsRoute + '/' + application._id, user.token, applicationName, FORBIDDEN, done);
        });

        var validateNameInformation = function (name, prefix, host, done) {
            return function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                var app = JSON.parse(res.text);
                validateApplication(app);
                if (name) {
                    should(app.name).equal(name);
                }
                if (prefix) {
                    should(app.prefix).equal(prefix);
                }
                if (host) {
                    should(app.host).equal(host);
                }

                done();
            };
        };

        it('should PUT application\'s name', function (done) {
            authPut(applicationsRoute + '/' + application._id, admin.token, applicationName, SUCCESS,
                validateNameInformation(applicationName.name, null, null, done));
        });

        it('should PUT a specific application\'s prefix and host', function (done) {
            authPost(applicationsRoute, admin.token, {
                prefix: 'prefix',
                host: 'http://myurl.com'
            }, SUCCESS, function (err, res) {
                should.not.exist(err);
                var result = JSON.parse(res.text);

                testApplication._id = result._id;
                authPut(applicationsRoute + '/' + result._id, admin.token, {
                    prefix: 'new_prefix',
                    host: 'http://myurl22.com'
                }, SUCCESS, validateNameInformation(null, 'new_prefix', null, done));
            });
        });

        it('should PUT a specific application\'s anonymous routes array', function (done) {
            var anonymousRoutes = ['/r1', '/r2', ''];
            var srcRoutes = ['/r1', '/rX'];
            authPost(applicationsRoute, admin.token, {
                prefix: 'prefix2',
                host: 'http://myurl2.com',
                anonymous: srcRoutes
            }, SUCCESS, function (err, res) {
                should.not.exist(err);
                var result = JSON.parse(res.text);

                testApplication._id = result._id;
                authPut(applicationsRoute + '/' + result._id, admin.token, {
                    anonymous: anonymousRoutes
                }, SUCCESS, function (err, res) {
                    should.not.exist(err);
                    var app = JSON.parse(res.text);

                    should(app.anonymous.length).equal(srcRoutes.length + 1);
                    should(app.anonymous).not.containDeep(anonymousRoutes);
                    should(app.anonymous).containDeep(['/r2']);
                    should(app.anonymous).containDeep(srcRoutes);
                    done();
                });
            });
        });

        it('should not PUT a specific application\'s duplicated prefix', function (done) {
            authPut(applicationsRoute + '/' + testApplication._id, admin.token, {
                prefix: gleanerPrefix
            }, FORBIDDEN, done);
        });

        it('should not PUT a specific application\'s duplicated host', function (done) {
            authPut(applicationsRoute + '/' + testApplication._id, admin.token, {
                host: gleanerHost
            }, FORBIDDEN, done);
        });
    });

    /** /api/:prefix* **/

    var route = '/route1';
    var forbiddenRoute = '/route2';

    var express = require('express');

    // Creates a STUB Gleaner app
    var expressApp = express();
    expressApp.use(require('body-parser').json());

    expressApp.use(route, function (req, res) {
        should(req.headers['x-gleaner-user']).equal(user.username);
        res.sendStatus(SUCCESS);
    });
    expressApp.use(anonymousRoute, function (req, res) {
        should.not.exist(req.headers['x-gleaner-user']);
        res.sendStatus(SUCCESS);
    });

    expressApp.listen(gleanerPort);

    var methods = ['get', 'post', 'put', 'delete'];

    var gleanerProxyBaseUrl = '/api/proxy/' + gleanerPrefix;
    var someData = {
        data: 'asddsa'
    };

    methods.forEach(function (method) {
        var upperCaseMethod = method.toUpperCase();
        describe(upperCaseMethod + '/:proxy*', function () {

            it('should ' + upperCaseMethod + ' (proxy) the route ' + route, function (done) {
                request[method](gleanerProxyBaseUrl + route).send(someData).set('Authorization', 'Bearer ' + user.token)
                    .expect(SUCCESS).end(done);
            });

            it('should not ' + upperCaseMethod + ' (proxy) the route ' + forbiddenRoute, function (done) {
                request[method](gleanerProxyBaseUrl + forbiddenRoute).send(someData).set('Authorization', 'Bearer ' + user.token)
                    .expect(FORBIDDEN).end(done);
            });

            it('should not ' + upperCaseMethod + ' (proxy) a route with an invalid_token', function (done) {
                request[method](gleanerProxyBaseUrl).send(someData).set('Authorization', 'Bearer invalid_token')
                    .expect(UNAUTHORIZED).end(done);
            });

            it('should not ' + upperCaseMethod + ' (proxy) a route without the Authorization header', function (done) {
                request[method](gleanerProxyBaseUrl).send(someData).expect(UNAUTHORIZED).end(done);
            });
        });
    });

    describe('ALL /:proxy/:prefix* for anonymous routes', function () {
        it('should ALL application\'s anonymous routes', function (done) {
            methods.forEach(function (method) {
                request[method](gleanerProxyBaseUrl + anonymousRoute).send(someData)
                    .expect(SUCCESS).end(function (err, res) {
                        should.not.exist(err);
                        should(res.text).equal('OK');
                        if (method === 'delete') {
                            done();
                        }
                    });
            });
        });
    });

    /** /api/users **/
    var usersRoute = '/api/users';

    describe(GET + usersRoute, function () {

        it('should not GET users with an invalid_token', function (done) {
            get(usersRoute, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET users with an unauthorized token', function (done) {
            get(usersRoute, user.token, FORBIDDEN, done);
        });

        it('should correctly GET users', function (done) {
            get(usersRoute, admin.token, SUCCESS, function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                res = JSON.parse(res.text);

                // Data validation
                var data = res.data;
                should(data).be.an.Array();
                if (data.length > 0) {
                    // User validation
                    var user = data[0];
                    validateUser(user);
                }


                // Pages validation
                validatePages(res.pages);

                // Items validation
                validateItems(res.items);
                done();
            });
        });
    });

    /** /api/users/:userId **/

    var email = 'new@email.com';
    var name = {
        first: 'testFirst',
        middle: 'testMiddle',
        last: 'testLast'
    };
    var userInfo = {
        email: 'user' + email,
        name: name
    };
    var adminInfo = {
        email: 'admin' + email,
        name: name
    };
    var invalidInfo = {
        email: 'invalidEmail',
        name: name
    };

    describe(GET + usersRoute + '/:userId', function () {

        it('should not GET a specific user with an invalid_token', function (done) {
            get(usersRoute + '/' + admin._id, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET a specific user with an unauthorized token', function (done) {
            get(usersRoute + '/' + admin._id, user.token, FORBIDDEN, done);
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
            get(usersRoute + '/' + user._id, user.token, SUCCESS, validateUserInformation(user._id, user.username, user.email, done));
        });

        it('should GET its own admin information', function (done) {
            get(usersRoute + '/' + admin._id, admin.token, SUCCESS, validateUserInformation(admin._id, admin.username, admin.email, done));
        });

        it('should GET a specific user that its not his own information', function (done) {
            get(usersRoute + '/' + user._id, admin.token, SUCCESS, validateUserInformation(user._id, user.username, user.email, done));
        });
    });

    describe(PUT + usersRoute + '/:userId', function () {

        it('should not PUT a specific user\'s name and email with an invalid_token', function (done) {
            authPut(usersRoute + '/' + admin._id, 'invalid_token', adminInfo, UNAUTHORIZED, done);
        });

        it('should not PUT a specific user\'s name and email with an unauthorized token', function (done) {
            authPut(usersRoute + '/' + admin._id, user.token, adminInfo, FORBIDDEN, done);
        });

        it('should not PUT its own user name and email with an invalid email', function (done) {
            authPut(usersRoute + '/' + user._id, user.token, invalidInfo, FORBIDDEN, done);
        });

        var validateNameInformation = function (infoData, done) {
            return function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                var user = JSON.parse(res.text);

                validateUser(user);
                should(user.name.first).equal(infoData.name.first);
                should(user.name.middle).equal(infoData.name.middle);
                should(user.name.last).equal(infoData.name.last);

                done();
            };
        };

        it('should PUT its own user name and email', function (done) {
            authPut(usersRoute + '/' + user._id, user.token, userInfo, SUCCESS, validateNameInformation(userInfo, done));
        });

        it('should PUT its own admin name and email', function (done) {
            authPut(usersRoute + '/' + admin._id, admin.token, adminInfo, SUCCESS, validateNameInformation(adminInfo, done));
        });

        it('should PUT a specific user name and email that is not his own', function (done) {
            authPut(usersRoute + '/' + user._id, admin.token, userInfo, SUCCESS, validateNameInformation(userInfo, done));
        });

        it('should not PUT a specific user name and email, email duplicated', function (done) {
            authPut(usersRoute + '/' + user._id, admin.token, adminInfo, FORBIDDEN, done);
        });
    });

    var oldPassword = {
        password: '12321',
        newPassword: 'new12321'
    };
    var incorrectPassword = {
        password: 'bad',
        newPassword: 'new12321'
    };
    var badRequest = {
        password: '12321'
    };
    describe(PUT + usersRoute + '/:userId/password', function () {

        it('should not PUT a new password', function (done) {
            authPut(usersRoute + '/' + user._id + '/password', user.token, incorrectPassword, UNAUTHORIZED, done);
        });

        it('should not PUT a new password with bad id', function (done) {
            authPut(usersRoute + '/12345/password', user.token, incorrectPassword, 404, done);
        });

        it('should not PUT a new password', function (done) {
            authPut(usersRoute + '/' + user._id + '/password', user.token, badRequest, BAD_REQUEST, done);
        });

        it('should PUT a new password', function (done) {
            authPut(usersRoute + '/' + user._id + '/password', user.token, oldPassword, SUCCESS, function (err, res) {
                should.not.exist(err);
                authPut(usersRoute + '/' + user._id + '/password', user.token, oldPassword, UNAUTHORIZED, done);
            });
        });
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
    /** /api/users/:userId/roles **/

    describe(GET + usersRoute + '/:userId/roles', function () {

        it('should not GET a specific user roles with an invalid_token', function (done) {
            get(usersRoute + '/' + admin._id + '/roles', 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET a specific user roles with an unauthorized token', function (done) {
            get(usersRoute + '/' + admin._id + '/roles', user.token, FORBIDDEN, done);
        });

        it('should GET his own roles being an admin', function (done) {
            get(usersRoute + '/' + admin._id + '/roles', admin.token, SUCCESS, validateRolesInformation(done));
        });


        it('should GET his own roles being a user', function (done) {
            get(usersRoute + '/' + user._id + '/roles', user.token, SUCCESS, validateRolesInformation(done));
        });

        it('should GET a specific user\'s roles being authorized (admin)', function (done) {
            get(usersRoute + '/' + user._id + '/roles', admin.token, SUCCESS, validateRolesInformation(done));
        });
    });

    /** /api/roles **/
    var rolesRoute = '/api/roles';

    describe(GET + rolesRoute, function () {

        it('should not GET roles because of an invalid_token', function (done) {
            get(rolesRoute, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET users with an unauthorized token', function (done) {
            get(rolesRoute, user.token, FORBIDDEN, done);
        });

        it('should correctly GET roles', function (done) {

            get(rolesRoute, admin.token, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                done();
            });
        });
    });

    var appRoleRoute = 'gleaner/resource-4';
    var notAppRoleRoute = 'noApp/resource-5';
    var role1 = {
        roles: 'role1',
        allows: [
            {resources: 'resource-1', permissions: ['permission-1', 'permission-3']},
            {resources: ['resource-2', 'resource-3', appRoleRoute, notAppRoleRoute], permissions: ['permission-2']}
        ]
    };

    var role2 = {
        roles: 'role2',
        resources: [
            'resource-1',
            'resource-2',
            'resource-3',
            appRoleRoute,
            notAppRoleRoute
        ],
        permissions: [
            'permission-1',
            'permission-2',
            'permission-3'
        ]
    };
    describe(POST + rolesRoute, function () {

        it('should not POST role because of an invalid_token', function (done) {
            post(rolesRoute, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not POST role, bad fields', function (done) {
            var wrongRole1 = {
                name: 'role name',
                allows: [
                    {resources: 'resource-1', permissions: ['permission-1', 'permission-3']},
                    {resources: ['resource-2', 'resource-3'], permissions: ['permission-2']}
                ]
            };

            authPost(rolesRoute, admin.token, wrongRole1, BAD_REQUEST, done);
        });

        it('should not POST role, bad fields', function (done) {
            var wrongRole2 = {
                roles: 'bad role'
            };

            authPost(rolesRoute, admin.token, wrongRole2, BAD_REQUEST, done);
        });

        it('should not POST role with an unauthorized token', function (done) {

            authPost(rolesRoute, user.token, role1, FORBIDDEN, done);

        });

        it('should correctly POST role1', function (done) {

            authPost(rolesRoute, admin.token, role1, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                should(res).containDeep([role1.roles]);
                get(applicationsRoute + '/' + application._id, admin.token, SUCCESS, function (err, res) {
                    res = JSON.parse(res.text);
                    should(res).be.an.Object();
                    should(res.routes).containDeep([appRoleRoute]);
                    should(res.routes).not.containDeep([notAppRoleRoute]);
                    done();
                });
            });
        });

        it('should correctly POST role2', function (done) {

            authPost(rolesRoute, admin.token, role2, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                should(res).containDeep([role2.roles]);
                get(applicationsRoute + '/' + application._id, admin.token, SUCCESS, function (err, res) {
                    res = JSON.parse(res.text);
                    should(res).be.an.Object();
                    should(res.routes).containDeep([appRoleRoute]);
                    should(res.routes).not.containDeep([notAppRoleRoute]);
                    done();
                });
            });
        });

        it('should not POST role, the role already exists.', function (done) {
            authPost(rolesRoute, admin.token, role1, BAD_REQUEST, done);
        });
    });

    var routeRoleId = rolesRoute + '/:roleName';
    var validRoleRouteId = rolesRoute + '/' + role2.roles;
    var invalidRoleRouteId = rolesRoute + '/invalidRole';
    describe(GET + routeRoleId, function () {

        it('should not GET the resources and permissions of role because of an invalid_token', function (done) {
            get(validRoleRouteId, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET the resources and permissions, the role doesn\'t exist', function (done) {
            get(invalidRoleRouteId, admin.token, BAD_REQUEST, done);
        });

        it('should not GET the resources and permissions with an unauthorized token', function (done) {

            get(invalidRoleRouteId, user.token, FORBIDDEN, done);
        });

        it('should correctly GET resources and permissions of role', function (done) {

            get(validRoleRouteId, admin.token, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                role2.resources.forEach(function (resource) {
                    should(res[resource.toString()]).be.an.Array();
                    should(res[resource.toString()]).containDeep(role2.permissions);
                });
                done();
            });
        });
    });

    var resourcesPath = '/resources';
    var routeResourcesRole = routeRoleId + resourcesPath;
    var validResourcesRoleId = validRoleRouteId + resourcesPath;
    var invalidResourcesRoleId = invalidRoleRouteId + resourcesPath;

    var theResource = '/roles/:roleName/newResource';
    var thePermission = 'newPermission';
    var resource1 = {
        resources: [
            theResource
        ],
        permissions: [
            thePermission,
            'perm-1',
            'perm-2'
        ]
    };
    describe(POST + routeResourcesRole, function () {

        it('should not POST role because of an invalid_token', function (done) {
            authPost(validResourcesRoleId, 'invalid_token', resource1, UNAUTHORIZED, done);
        });

        it('should not POST resource, the role doesn\'t exist', function (done) {
            authPost(invalidResourcesRoleId, admin.token, resource1, BAD_REQUEST, done);
        });

        it('should not POST resource with an unauthorized token', function (done) {

            authPost(validResourcesRoleId, user.token, resource1, FORBIDDEN, done);
        });

        it('should correctly POST the new resource in the role', function (done) {

            authPost(validResourcesRoleId, admin.token, resource1, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                resource1.resources.forEach(function (resource) {
                    should(res[resource.toString()]).be.an.Array();
                    should(res[resource.toString()]).containDeep(resource1.permissions);
                });
                done();
            });
        });
    });

    var routeResourceId = routeResourcesRole + '/*';
    var validResourcesId = validResourcesRoleId + '/' + theResource;
    var invalidResourcesId = invalidResourcesRoleId + '/invalidResource';
    describe(GET + routeResourceId, function () {

        it('should not GET the permissions of resources in role because of an invalid_token', function (done) {
            get(validResourcesId, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET the permissions of resources in role, the permission doesn\'t exist', function (done) {
            get(invalidResourcesId, admin.token, BAD_REQUEST, done);
        });

        it('should not GET the permissions of resources in role with an unauthorized token', function (done) {

            get(validResourcesId, user.token, FORBIDDEN, done);
        });

        it('should correctly GET the permissions of resources in role', function (done) {

            get(validResourcesId, admin.token, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                resource1.permissions.forEach(function (permission) {
                    should(res).containDeep([permission]);
                });
                done();
            });
        });
    });

    /** /api/users/roles **/
    describe(POST + usersRoute + '/:userId/roles', function () {
        var newValidRoles = ['role1', 'role2'];
        var newInvalidRoles = ['role1', 'role2', 'role3'];
        var newInvalidRole = ['role3'];

        it('should not POST roles to an user with an invalid token', function (done) {
            authPost(usersRoute + '/' + admin._id + '/roles', 'invalid_token', newValidRoles, UNAUTHORIZED, done);
        });

        it('should not POST roles to himself with an unauthorized token', function (done) {
            authPost(usersRoute + '/' + user._id + '/roles', user.token, newValidRoles, FORBIDDEN, done);
        });

        it('should not POST roles to an user with an unauthorized token', function (done) {
            authPost(usersRoute + '/' + admin._id + '/roles', user.token, newValidRoles, FORBIDDEN, done);
        });

        it('should not POST roles, some role doesn\'t exist', function (done) {
            authPost(usersRoute + '/' + admin._id + '/roles', admin.token, newInvalidRoles, BAD_REQUEST, done);
        });

        it('should not POST roles, some role doesn\'t exist', function (done) {
            authPost(usersRoute + '/' + admin._id + '/roles', admin.token, newInvalidRole, BAD_REQUEST, done);
        });

        var validatePOSTroles = function (newValidRoles, done) {
            return function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                var result = JSON.parse(res.text);
                should(result.message).be.a.String();

                get(usersRoute + '/' + admin._id + '/roles', admin.token, SUCCESS, function (err, res) {

                    var roles = JSON.parse(res.text);

                    should(roles).containDeep(newValidRoles);

                    done();
                });
            };
        };

        it('should POST roles to himself being authorized', function (done) {
            authPost(usersRoute + '/' + admin._id + '/roles', admin.token, newValidRoles, SUCCESS,
                validatePOSTroles(newValidRoles, done));
        });

        it('should POST roles to a specific user being authorized (admin)', function (done) {
            authPost(usersRoute + '/' + user._id + '/roles', admin.token, newValidRoles, SUCCESS,
                validatePOSTroles(newValidRoles, done));
        });
    });

    describe(GET + usersRoute + '/:userId/*/:permissionName', function () {
        var noPermission = 'noPermission';

        it('should not GET response with an invalid token', function (done) {
            get(usersRoute + '/' + admin._id + '/' + theResource + '/' + thePermission, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not GET response from an user with an unauthorized token', function (done) {
            get(usersRoute + '/' + admin._id + '/' + theResource + '/' + thePermission, user.token, FORBIDDEN, done);
        });

        it('should GET response (true) from himself being authorized (admin)', function (done) {
            get(usersRoute + '/' + admin._id + '/' + theResource + '/' + thePermission, admin.token, SUCCESS,
                function (err, res) {
                    res = JSON.parse(res.text);
                    should(res).be.an.Boolean();
                    should.equal(res, true);
                    done();
                });
        });

        it('should GET response (false) from himself being authorized (admin)', function (done) {
            get(usersRoute + '/' + admin._id + '/' + theResource + '/' + noPermission, admin.token, SUCCESS,
                function (err, res) {
                    res = JSON.parse(res.text);
                    should(res).be.an.Boolean();
                    should.equal(res, false);
                    done();
                });
        });
    });

    /**DELETES**/

    /** DELETES /api/applications **/
    describe(DEL + applicationsRoute + '/:applicationId', function () {

        var validateDeletedApplication = function (prefix, done) {
            return function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                res = JSON.parse(res.text);
                should(res.message).be.a.String();

                app.db.model('application').findByPrefix(prefix, function (error, app) {
                    should.not.exist(error);
                    should.not.exist(app);
                    get(rolesRoute + '/' + role1.roles, admin.token, SUCCESS, function (err, res) {
                        res = JSON.parse(res.text);
                        should(res).be.an.Object();
                        should.not.exist(res[appRoleRoute]);

                        done();
                    });
                });
            };
        };

        it('should DELETE an application correctly with an authorized token', function (done) {

            del(applicationsRoute + '/' + application._id, 'invalid_token', UNAUTHORIZED, function (err) {
                should.not.exist(err);
                del(applicationsRoute + '/' + application._id, user.token, FORBIDDEN, function (err) {
                    should.not.exist(err);

                    del(applicationsRoute + '/' + application._id, admin.token, SUCCESS,
                        validateDeletedApplication(application.prefix, done));
                });
            });
        });
    });

    /** DELETE /api/users **/
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
                username: 'testUser1',
                password: 'testUser1Pw',
                email: 'testUser1Pw@comp.ink'
            }, SUCCESS, function (err, res) {
                should.not.exist(err);
                var result = JSON.parse(res.text);

                del(usersRoute + '/' + result.user._id, 'invalid_token', UNAUTHORIZED, function (err) {
                    should.not.exist(err);

                    del(usersRoute + '/' + result.user._id, admin.token, SUCCESS,
                        validateDeletedUser(result.user.username, done));
                });
            });
        });

        it('should DELETE himself', function (done) {
            post(signupRoute, {
                username: 'testUser1',
                password: 'testUser1Pw',
                email: 'testUser1Pw@comp.ink'
            }, SUCCESS, function (err, res) {
                should.not.exist(err);
                var result = JSON.parse(res.text);

                post(loginRoute, {
                    username: 'testUser1',
                    password: 'testUser1Pw'
                }, SUCCESS, function (err, res) {
                    res = JSON.parse(res.text);
                    var testUserToken = res.user.token;
                    del(usersRoute + '/' + result.user._id, testUserToken, SUCCESS,
                        validateDeletedUser(result.user.username, done));
                });
            });
        });
    });

    /** DELETE role in /api/users **/
    describe(DEL + usersRoute + '/:userId/roles', function () {
        var deletedRole = 'role1';

        it('should not DELETE roles from an user with an invalid token', function (done) {
            del(usersRoute + '/' + admin._id + '/roles/' + deletedRole, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not DELETE roles from an user with an unauthorized token', function (done) {
            del(usersRoute + '/' + admin._id + '/roles/' + deletedRole, user.token, FORBIDDEN, done);
        });

        it('should not DELETE roles himself with an unauthorized token', function (done) {
            del(usersRoute + '/' + user._id + '/roles/' + deletedRole, user.token, FORBIDDEN, done);
        });

        var validateDELroles = function (deletedRoles, id, done) {
            return function (err, res) {
                should.not.exist(err);
                should(res).be.an.Object();

                var result = JSON.parse(res.text);
                should(result.message).be.a.String();

                get(usersRoute + '/' + id + '/roles', admin.token, SUCCESS, function (err, res) {

                    var roles = JSON.parse(res.text);

                    should(roles).not.containDeep(deletedRoles);

                    done();
                });
            };
        };

        var deletedRoleArray = [deletedRole];

        it('should DELETE roles from a specific user being authorized', function (done) {
            del(usersRoute + '/' + user._id + '/roles/' + deletedRole, admin.token, SUCCESS,
                validateDELroles(deletedRoleArray, user._id, done));
        });

        it('should DELETE roles from himself being authorized (admin)', function (done) {
            del(usersRoute + '/' + admin._id + '/roles/' + deletedRole, admin.token, SUCCESS,
                validateDELroles(deletedRoleArray, admin._id, done));
        });

        it('shouldn\'t DELETE the admin role from himself', function (done) {
            del(usersRoute + '/' + admin._id + '/roles/admin', admin.token, FORBIDDEN, done);
        });
    });

    /** DELETE /api/roles **/
    var permissionsPath = '/permissions';
    var routePermissionId = routeResourceId + permissionsPath + '/:permissionName';
    var validPermissionId = validResourcesId + permissionsPath + '/' + thePermission;
    var invalidPermissionId = invalidResourcesId + permissionsPath + '/invalidPermission';
    describe(DEL + routePermissionId, function () {

        it('should not DELETE the permission because of an invalid_token', function (done) {
            del(validPermissionId, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not DELETE the permission, the resource in role doesn\'t exist', function (done) {
            del(invalidPermissionId, admin.token, BAD_REQUEST, done);
        });

        it('should not DELETE the permission in role with an unauthorized token', function (done) {

            del(validPermissionId, user.token, FORBIDDEN, done);
        });

        it('should correctly DELETE the permission in role', function (done) {

            del(validPermissionId, admin.token, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                should(res).not.containDeep([thePermission]);
                done();
            });
        });
    });

    describe(DEL + routeResourceId, function () {

        it('should not DELETE the resource because of an invalid_token', function (done) {
            del(validResourcesId, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not DELETE the resource, the resource in role doesn\'t exist', function (done) {
            del(invalidResourcesId, admin.token, BAD_REQUEST, done);
        });

        it('should not DELETE the resource in role with an unauthorized token', function (done) {

            del(validResourcesId, user.token, FORBIDDEN, done);
        });

        it('should correctly DELETE the resource in role', function (done) {

            del(validResourcesId, admin.token, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Object();
                should.not.exist(res[resource1.toString()]);
                done();
            });
        });
    });

    var adminRoleRouteId = rolesRoute + '/Admin';
    describe(DEL + routeRoleId, function () {

        it('should not DELETE the role because of an invalid_token', function (done) {
            del(validRoleRouteId, 'invalid_token', UNAUTHORIZED, done);
        });

        it('should not DELETE the role, the role doesn\'t exist', function (done) {
            del(invalidRoleRouteId, admin.token, BAD_REQUEST, done);
        });

        it('should not DELETE the role, the role is Admin', function (done) {
            del(adminRoleRouteId, admin.token, BAD_REQUEST, done);
        });

        it('should not DELETE the role', function (done) {

            del(validRoleRouteId, user.token, FORBIDDEN, done);
        });

        it('should correctly DELETE the role', function (done) {

            del(validRoleRouteId, admin.token, SUCCESS, function (err, res) {
                res = JSON.parse(res.text);
                should(res).be.an.Array();
                should(res).not.containDeep([role2.roles]);
                done();
            });
        });
    });
});

