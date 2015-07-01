var express = require('express'),
    router = express.Router(),
    async = require('async');

/* POST signup. */
router.post('/', function(req, res, next) {
    var account = req.app.db.model('account');
    var user = req.app.db.model('user');

    async.auto({
        validate: function (done) {
            if(!req.body.username){
                return done(new Error('username required'))
            }

            if(!req.body.password){
                return done(new Error('password required'))
            }

            if(!req.body.email){
                return done(new Error('email required'))
            }

            done(null, false);
        },
        user: function (done) {
            user.register(new user({
                username: req.body.username,
                email: req.body.email,
                timeCreated: new Date()
            }), req.body.password, done);
        },
        account: ['user', function (done, results) {

            var name = req.body.name;
            var username = req.body.username;

            account.create(results.user._id, username, name, done);
        }],
        linkUser: ['account', function (done, results) {
            var id = results.account._id;
            var update = {
                $set: {
                    user: {
                        id: results.user._id,
                        name: results.user.username
                    }
                }
            };
            account.findByIdAndUpdate(id, update, done);
        }],
        linkAccount: ['account', function (done, results) {
            var id = results.user._id;
            var update = {
                $set: {
                    roles: {
                        account: results.account._id
                    }
                }
            };

            user.findByIdAndUpdate(id, update, done);
        }],
        welcome: ['linkUser', 'linkAccount', function (done, results) {

            var user = results.linkAccount;

            req.app.utility.sendmail(req, res, {
                from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
                to: req.body.email,
                subject: req.app.config.projectName +' contact form',
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
                success: function() {
                    console.log('Email sent with success!');
                },
                error: function(err) {
                    console.error(err);
                }
            });

            done(null, false);
        }],
        login: ['linkUser', 'linkAccount', function (done, results) {
            req.app.passport.authenticate('local', function(err, user, info) {
                if(err){
                    return done(err);
                }
                if(!user){
                    return done(info.message)
                } else {
                    req.logIn(user, function(err) {
                        if (err) {
                            return done(err);
                        }
                        res.json({
                            user: {
                                username: req.user.username,
                                email: req.user.email,
                                roles: req.user.roles
                            }
                        });
                        done(null, false)
                    });
                }
            })(req, res, next);
        }]
    }, function (err) {
        if (err) {
            res.send({message : err.toString()});
        }
    });
});

module.exports = router;