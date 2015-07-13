var express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    async = require('async');

router.post('/', function (req, res, next) {
    req.app.passport.authenticate('local', function (err, user, info) {
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
                                id: user._id,
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

router.post('/forgot', function (req, res, next) {
    async.waterfall([
        /*Generate token*/
        function (done) {
            require('crypto').randomBytes(20, function (err, buf) {
                if (!err) {
                    var token = buf.toString('hex');
                }
                done(err, token);
            });
        },
        /*Save token*/
        function (token, done) {
            req.app.db.model('user').findOne({email: req.body.email}, function (err, user) {
                if (err) {
                    return done(err)
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
                    res.send({message: 'mail sent'});
                    done();
                },
                error: function (err) {
                    done(err);
                }
            });
        }
    ], function (err) {
        if (err) {
            next(err)
        }
    });
});

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
                        return done(err)
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

            res.send({message: 'Success'});
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
                    console.log('Email sent')
                },
                error: function (err) {
                    console.log('Error : ' + err);
                }
            });
            done()
        }
    ], function (err) {
        if (err) {
            next(err)
        }
    });
});

module.exports = router;
