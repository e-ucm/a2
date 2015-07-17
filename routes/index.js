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

module.exports = router;
