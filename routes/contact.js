'use strict';

var express = require('express'),
    router = express.Router(),
    Q = require('q');

/**
 * @api {post} /contact Send contact mail
 * @apiName Contact
 * @apiGroup Contact
 *
 * @apiParam {String} name User name.
 * @apiParam {String} mail User mail.
 * @apiParam {String} text Message.
 *
 * @apiPermission none
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "name": "Your Name",
 *          "email": "your@email.com",
 *          "text": "Your message here"
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "message": "Success."
 *      }
 *
 * @apiError(400) RequiredName Required the name field.
 *
 * @apiError(400) RequiredEmail Required the email field.
 *
 * @apiError(400) InvalidEmail Invalid email.
 *
 * @apiError(400) RequiredText Required the text field.
 */
router.post('/', function (req, res, next) {
    Q.resolve().then(function () {
        var err;
        if (!req.body.name) {
            err = new Error('Required name');
            err.status = 400;
            throw err;
        }

        if (!req.body.email) {
            err = new Error('Required email');
            err.status = 400;
            throw err;
        } else if (!require('validator').isEmail(req.body.email)) {
            err = new Error('Invalid email');
            err.status = 400;
            throw err;
        }

        if (!req.body.text) {
            err = Error('Required text');
            err.status = 400;
            throw err;
        }
    }).then(function () {
        req.app.utility.sendmail(req, res, {
            from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
            replyTo: req.body.email,
            to: req.app.config.systemEmail,
            subject: req.app.config.projectName + ' contact form',
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
            success: function () {
                res.sendDefaultSuccessMessage();
            },
            error: function (err) {
                next(err);
            }
        });
    }).fail(function (err) {
        next(err);
    });

});

module.exports = router;
