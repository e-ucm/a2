var express = require('express'),
    router = express.Router(),
    async = require('async');

/* GET signup page. */
router.get('/', function(req, res, next) {
    res.render('signup', {
    });
});

/* POST signup. */
router.post('/', function (req, res, next) {
    var userModel = req.app.db.model('user');

    async.auto({
        validate: function (done) {
            if (!req.body.username) {
                var error = new Error('Username required!');
                error.status = 400;
                return done(error);
            }

            if (!req.body.password) {
                var error = new Error('Password required!');
                error.status = 400;
                return done(error);
            }

            if (!req.body.email) {
                var error = new Error('Email required!');
                error.status = 400;
                return done(error);
            }

            done();
        },
        user: ['validate', function (done) {
            userModel.register(new userModel({
                username: req.body.username,
                email: req.body.email,
                timeCreated: new Date(),
                verification: {
                    complete: false
                }
            }), req.body.password, function(err, resultUser) {
                if(err) {
                    return done(err);
                }
                done(null, resultUser);
            });
        }],
        welcome: ['user', function (done, results) {

            var user = results.user;

            req.app.utility.sendmail(req, res, {
                from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
                to: req.body.email,
                subject: req.app.config.projectName + ' signup',
                textPath: 'signup/email-text',
                htmlPath: 'signup/email-html',
                locals: {
                    username: user.username,
                    email: req.body.email,
                    projectName: req.app.config.projectName
                },
                name: req.body.name,
                email: req.body.email,
                projectName: req.app.config.projectName,
                success: function () {
                    console.log('Email sent with success!');
                },
                error: function (err) {
                    console.warn('sending welcome email failed:', err);
                }
            });

            done();
        }]
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        var user = results.user;
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

module.exports = router;