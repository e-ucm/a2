'use strict';

var should = require('should');

var signupRoute = '/api/signup',
    loginRoute = '/api/login';

var adminPass = '321',
    adminName = 'admin',
    adminEmail = 'adminemail@comp.ink',
    adminToken = ' ',
    userPass = '123',
    userName = 'user',
    userEmail = 'useremail@comp.ink',gleanerPrefix = 'gleaner',
    role = 'gleanerUser';

module.exports = function(request, app) {
    var post = function (url, data, exprectedCode, callback) {
        request.post(url).send(data).expect(exprectedCode).end(callback);
    };
    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    /**                      Test SignUp                            **/
    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/

    describe('LogIn and Signup tests', function () {
        beforeEach(function (done) {
            var UserModel = app.db.model('user');
            UserModel.register(new UserModel({username: adminName, email: adminEmail}), adminPass, function() {
                app.db.collection('applications').insert({
                    name: 'gleaner',
                    prefix: gleanerPrefix,
                    host: 'localhost:3300',
                    autoroles: [role],
                    anonymous: [],
                    routes: [],
                    owner: adminName
                }, function() {
                    app.acl.allow([{
                        roles: role,
                        allows: [
                            {resources: 'resource-1', permissions: 'permission-1'},
                            {resources: 'resource-2', permissions: 'permission-2'}
                        ]
                    }], function (err, result) {
                        done(err, result);
                    });
                });
            });
        });

        afterEach(function (done) {
            app.db.collection('users').drop(function() {
                app.db.collection('applications').drop(done);
            });
        });


        it('should not signUp correctly if the username is missing', function (done) {
            post(signupRoute, {
                password: userPass,
                email: userEmail
            }, 400, done);
        });

        it('should not signUp correctly if the password is missing', function (done) {
            post(signupRoute, {
                username: userName,
                email: userEmail
            }, 400, done);
        });

        it('should not signUp correctly if the email is missing', function (done) {
            post(signupRoute, {
                username: userName,
                password: userPass
            }, 400, done);
        });

        it('should signUp correctly', function (done) {
            post(signupRoute, {
                username: userName,
                password: userPass,
                email: userEmail
            }, 200, function (err, res) {
                should.not.exist(err);
                res = JSON.parse(res.text);
                should(res.user).be.Object();
                should(res.user._id).be.String();
                should(res.user.username).be.String();
                should.equal(res.user.username, userName);
                should(res.user.email).be.String();
                should.equal(res.user.email, userEmail);
                done();
            });
        });

        it('should not signUp correctly if the role doesn\'t exist', function (done) {
            post(signupRoute, {
                username: userName,
                password: userPass,
                email: userEmail,
                prefix: gleanerPrefix,
                role: 'invalidRole'
            }, 404, done);
        });

        it('should not signUp correctly if the role is admin', function (done) {
            post(signupRoute, {
                username: userName,
                password: userPass,
                email: userEmail,
                prefix: gleanerPrefix,
                role: 'admin'
            }, 403, done);
        });

        it('should not signUp correctly if the application with the prefix doesn\'t exist', function (done) {
            post(signupRoute, {
                username: userName,
                password: userPass,
                email: userEmail,
                prefix: 'invalidPrefix',
                role: role
            }, 404, done);
        });

        it('should not signUp correctly without a application prefix', function (done) {
            post(signupRoute, {
                username: userName,
                password: userPass,
                email: userEmail,
                role: role
            }, 400, done);
        });

        it('should signUp correctly', function (done) {
            post(signupRoute, {
                username: userName,
                password: userPass,
                email: userEmail,
                prefix: gleanerPrefix,
                role: role
            }, 200, function (err) {
                should.not.exist(err);
                app.acl.hasRole(userName, role, function (err, hasRole) {
                    should.not.exist(err);
                    should.equal(hasRole, true);
                    done();
                });
            });
        });

        /**-------------------------------------------------------------**/
        /**-------------------------------------------------------------**/
        /**                      Test LogIn                             **/
        /**-------------------------------------------------------------**/
        /**-------------------------------------------------------------**/

        it('should return a UNAUTHORIZED status code if no login data is provided', function (done) {
            post(loginRoute, {}, 401, done);
        });

        it('should return a UNAUTHORIZED status code if the credentials are incorrect', function (done) {
            post(loginRoute, {
                username: 'incorrectName',
                password: 'incorrectPass'
            }, 401, done);
        });

        it('should login correctly', function (done) {
            post(loginRoute, {
                username: adminName,
                password: adminPass
            }, 200, function (err, res) {
                should.not.exist(err);
                should(res).be.Object();
                res = JSON.parse(res.text);
                should(res.user).be.Object();
                should(res.user._id).be.String();
                should(res.user.username).be.String();
                should(res.user.email).be.String();
                should(res.user.token).be.String();
                adminToken = res.user.token;
                done();
            });
        });
    });
};