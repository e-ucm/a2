var express = require('express'),
    router = express.Router(),
    Q = require('q');

/* POST contact. */
router.post('/', function(req, res, next) {
    Q.resolve().then(function () {
        if (!req.body.name) {
            throw new Error('required name');
        }

        if (!req.body.email) {
            throw new Error('required email');
        } else if(!require('validator').isEmail(req.body.email)){
            throw new Error('invalid email');
        }

        if (!req.body.text) {
            throw Error('required text');
        }
    }).then(function() {
        req.app.utility.sendmail(req, res, {
            from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
            replyTo: req.body.email,
            to: req.app.config.systemEmail,
            subject: req.app.config.projectName +' contact form',
            textPath: 'contact/email-text',
            htmlPath: 'contact/email-html',
            locals: {
                name: req.body.name,
                email: req.body.email,
                text: req.body.text,
                projectName: req.app.config.projectName
            },
            name: req.body.name,
            email: req.body.email,
            text: req.body.text,
            projectName: req.app.config.projectName,
            success: function() {
                res.send({ message : 'succes'});
            },
            error: function(err) {
                throw err;
            }
        });
    }).fail(function (err){
        res.send({ error : err.toString()})
    });

});

module.exports = router;
