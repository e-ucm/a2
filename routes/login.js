var express = require('express'),
    router = express.Router();

router.post('/', function(req, res, next) {
    req.app.passport.authenticate('local', function(err, user, info) {
        if(err){
            return res.json(err);
        }
        if(!user){
            return res.json(info);
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
            });
        }
    })(req, res, next);
});

module.exports = router;