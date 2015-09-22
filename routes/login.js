'use strict';

var express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    async = require('async');

/**
 * @api {post} /login LogIn the user.
 * @apiName Login
 * @apiGroup Login
 *
 * @apiParam {String} username User username.
 * @apiParam {String} password User password.
 *
 * @apiPermission none
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "username": "username",
 *          "password": "pass"
 *      }
 *
 * @apiSuccess(200) {String} Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "user": {
 *              "_id": "559a447831b7acec185bf513",
 *              "username": "root",
 *              "email": "yourmail@ucm.es",
 *              "roles" : ["admin"],
 *              "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIU..."
 *          }
 *      }
 *
 * @apiError(401) UserNotFound User not found.
 */
router.post('/', function (req, res, next) {
    req.app.passport.authenticate('local', {session: false}, function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            err = new Error(info.message);
            err.status = 401;
            return next(err);
        } else {
            req.logIn(user, {session: false}, function (err) {
                if (err) {
                    return next(err);
                }

                async.waterfall([
                    /*Generate a random number*/
                    function (done) {
                        require('crypto').randomBytes(10, function (err, buf) {
                            if (err) {
                                return done(err);
                            }
                            var randNum = buf.toString('hex');
                            done(null, randNum);
                        });
                    },
                    /*Generate the token*/
                    function (randNum, done) {
                        var data = {
                            _id: user._id,
                            randNum: randNum
                        };

                        var expirationInSec = req.app.config.tokenExpirationInSeconds;
                        var token = jwt.sign(data, req.app.config.cryptoKey, {
                            expiresInSeconds: expirationInSec
                        });

                        req.app.tokenStorage.save(token, {
                            username: user.username
                        }, expirationInSec, done);
                    },
                    /*Send the login data*/
                    function (token, done) {
                        res.json({
                            user: {
                                _id: user._id,
                                username: user.username,
                                email: user.email,
                                token: token
                            }
                        });

                        done();
                    }
                ], function (err) {
                    if (err) {
                        return next(err);
                    }
                });
            });
        }
    })(req, res, next);
});

/**
 * @api {post} /login/forgot Sends an email with a key to reset the password.
 * @apiName Forgot
 * @apiGroup Login
 *
 * @apiParam {String} email User email.
 *
 * @apiPermission none
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "email": "your@email.com"
 *      }
 *
 * @apiSuccess(200) {String} Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(400) EmailDoesNotExist No account with that email address exists.
 *
 * @apiError(403) EmailAlreadySent Other email to reset password was sent recently.
 */
router.post('/forgot', function (req, res, next) {
    async.waterfall([
        /*Generate token*/
        function (done) {
            require('crypto').randomBytes(20, function (err, buf) {
                var token;
                if (!err) {
                    token = buf.toString('hex');
                }
                done(err, token);
            });
        },
        /*Save token*/
        function (token, done) {
            req.app.db.model('user').findOne({email: req.body.email}, function (err, user) {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    err = new Error('No account with that email address exists.');
                    err.status = 400;
                    return done(err);
                }

                if (user.resetPassword.expires !== undefined && user.resetPassword.expires.getTime() - 36000000 < Date.now()) {
                    err = new Error('Other email to reset password was sent recently');
                    err.status = 403;
                    return done(err);
                }

                user.resetPassword.token = token.toString();
                user.resetPassword.expires = Date.now() + 36000000; // 1 hour
                user.save(done(null, token));
            });
        },
        /*Send email to reset password*/
        function (token, done) {
            req.app.utility.sendmail(req, res, {
                from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
                to: req.body.email,
                subject: req.app.config.projectName + ' forgot password',
                textPath: 'forgot/email-text',
                htmlPath: 'forgot/email-html',
                locals: {
                    link: req.headers.host + '/login/reset/' + token,
                    projectName: req.app.config.projectName
                },
                email: req.body.email,
                projectName: req.app.config.projectName,
                success: function () {
                    res.sendDefaultSuccessMessage();
                    done();
                },
                error: function (err) {
                    done(err);
                }
            });
        }
    ], function (err) {
        if (err) {
            next(err);
        }
    });
});

/**
 * @api {post} /login/reset/:token Sets a new password in the user with token.
 * @apiName Reset
 * @apiGroup Login
 *
 * @apiParam {String} password The new user password.
 *
 * @apiPermission none
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "password": "newPassword"
 *      }
 *
 * @apiSuccess(200) {String} Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(401) InvalidToken Password reset token is invalid or has expired.
 *
 */
router.post('/reset/:token', function (req, res, next) {
    async.waterfall([
        /*Check user*/
        function (done) {
            req.app.db.model('user').findOne({
                "resetPassword.token": req.params.token.toString(),
                "resetPassword.expires": {$gt: Date.now()}
            }, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    err = new Error('Password reset token is invalid or has expired.');
                    err.status = 401;
                    return done(err);
                }

                user.setPassword(req.body.password, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    user.resetPassword = undefined;
                    user.save(function (err, result) {
                        if (err) {
                            return done(err);
                        }

                        done(null, result);
                    });
                });

            });
        },
        /*Mail notification*/
        function (user, done) {

            res.sendDefaultSuccessMessage();
            req.app.utility.sendmail(req, res, {
                from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
                to: user.email,
                subject: req.app.config.projectName + ' reset password',
                textPath: 'reset/email-text',
                htmlPath: 'reset/email-html',
                locals: {
                    projectName: req.app.config.projectName
                },
                email: user.email,
                projectName: req.app.config.projectName,
                success: function () {
                    console.log('Email sent');
                },
                error: function (err) {
                    console.log('Error : ' + err);
                }
            });
            done();
        }
    ], function (err) {
        if (err) {
            next(err);
        }
    });
});

module.exports = router;
