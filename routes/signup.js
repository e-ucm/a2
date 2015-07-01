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

            done();
        },
        user: function (done) {
            var username = req.body.username;
            var password = req.body.password;
            var email = req.body.email;

            user.create(username, password, email, done);
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

            res.send({
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles
                }
            });

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
                    console.log('email success')
                },
                error: function(err) {
                    throw err;
                }
            });
            done();
        }],
        login: ['linkUser', 'linkAccount', function (done, results) {
            req._passport.instance.authenticate('local', function(err, user) {
                if(err){
                    done(err);
                    return;
                }

                if(!user){
                    done(new Error('Login failed. That is strange.'));
                    return;
                } else {
                    req.login(user, function(err) {
                        if (err) {
                            done(err);
                            return;
                        }
                    });
                }

                console.log('logIn success');
                done();

            })(req, res, next);
        }]
    }, function (err) {
        if (err) {
            res.send({message : err.toString()});
        }
    });
});

module.exports = router;