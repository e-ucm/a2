/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

exports = module.exports = function (req, res, options) {
    /* Options = {
         from: String,
         to: String,
         cc: String,
         bcc: String,
         text: String,
         textPath String,
         html: String,
         htmlPath: String,
         attachments: [String],
         success: Function,
         error: Function
     } */

    var renderText = function (callback) {
        res.render(options.textPath, options.locals, function (err, text) {
            if (err) {
                callback(err, null);
            } else {
                options.text = text;
                return callback(null, 'done');
            }
        });
    };

    var renderHtml = function (callback) {
        res.render(options.htmlPath, options.locals, function (err, html) {
            if (err) {
                callback(err, null);
            } else {
                options.html = html;
                return callback(null, 'done');
            }
        });
    };

    var renderers = [];
    if (options.textPath) {
        renderers.push(renderText);
    }

    if (options.htmlPath) {
        renderers.push(renderHtml);
    }

    require('async').parallel(
        renderers,
        function (err) {
            if (err) {
                options.error('Email template render failed. ' + err);
                return;
            }

            var attachments = [];

            if (options.html) {
                attachments.push({data: options.html, alternative: true});
            }

            if (options.attachments) {
                for (var i = 0; i < options.attachments.length; i++) {
                    attachments.push(options.attachments[i]);
                }
            }
            var emailjs = require('emailjs/email');
            var emailer = emailjs.server.connect(req.app.config.smtp.credentials);
            emailer.send({
                from: options.from,
                to: options.to,
                'reply-to': options.replyTo || options.from,
                cc: options.cc,
                bcc: options.bcc,
                subject: options.subject,
                text: options.text,
                attachment: attachments
            }, function (err, message) {
                if (err) {
                    options.error('Email failed to send. ' + err);
                } else {
                    options.success(message);
                }
            });
        }
    );
};
