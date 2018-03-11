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

var express = require('express'),
    router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {
        title: 'Gleaner Users'
    });
});

/* GET RESTAPI page. */
router.get('/api', function (req, res) {
    res.render('apirest');
});

/* GET contact page. */
router.get('/contact', function (req, res) {
    res.render('contact');
});

/* GET login page. */
router.get('/login', function (req, res) {
    res.render('login');
});

/* GET forgot page. */
router.get('/login/forgot', function (req, res) {
    res.render('forgot');
});

/* GET reset page. */
router.get('/login/reset/:token', function (req, res) {
    res.render('reset', {
        token: req.params.token
    });
});

/* GET signup page. */
router.get('/signup', function (req, res) {
    res.render('signup');
});

/* GET users list view. */
router.get('/users', function (req, res) {
    res.render('users');
});

/* GET applications list view. */
router.get('/applications', function (req, res) {
    res.render('applications');
});

/* GET roles list view. */
router.get('/roles', function (req, res) {
    res.render('roles');
});

/* GET pofile view. */
router.get('/users/:userId', function (req, res) {
    res.render('profile', {
        userId: req.params.userId
    });
});

/* GET login by plugin */
router.get('/loginbyplugin/', function (req, res) {
    res.render('loginplugin', {user: JSON.stringify(req.query)});
});

module.exports = router;
