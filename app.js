'use strict';

var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    jwt = require('express-jwt'),
    tokenStorage = require('./tokenStorage/token-storage');

var config = require((process.env.NODE_ENV === 'test') ? './config-test' : './config'),
    views = require('./routes/index'),
    contact = require('./routes/contact'),
    signup = require('./routes/signup'),
    users = require('./routes/users'),
    roles = require('./routes/roles'),
    login = require('./routes/login'),
    logout = require('./routes/logout');

var app = express();

var RedisBackend = require('./tokenStorage/redis-backend');
var backend = new RedisBackend(config.redisdb);
tokenStorage = new tokenStorage(backend);

//keep reference to config
app.config = config;

app.tokenStorage = tokenStorage;

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');

mongoose.set('debug', app.get('env') === 'development');
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.on('connected', function () {
    console.log('Mongo db Connected!');
    require('./roles')(app);
});
//config data models
require('./models')(app, mongoose);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
if(app.get('env') === 'development') {
    app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

var jwtCheck = jwt({
    secret: config.cryptoKey
});

app.use(jwtCheck.unless({
    path: [
        // Views RegExp: match anything that doesn't start with 'apiRoot'
        new RegExp('^(?!\\' + config.apiPath + '\/).*$'),

        // REST API: match some unprotected routes such as /contact, /login, /signup, etc.
        config.apiPath + '/contact',
        config.apiPath + '/login',
        config.apiPath + '/login/forgot',
        new RegExp(config.apiPath + '\/login\/reset\/.*'),
        config.apiPath + '/signup'
    ]
}));
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        err.status = 401;
        return next(err);
    }
    next();
});
app.use(function (req, res, next) {
    if (req.user) {
        return tokenStorage.middleware(req, res, next);
    }
    next();
});

app.passport = passport;

require('./passport')(app);

app.use(function (req, res, next) {
    res.sendDefaultSuccessMessage = function() {
        res.json({
            message: 'Success.'
        });
    };
    next();
});

app.use('/', views);
app.use(config.apiPath + '/contact', contact);
app.use(config.apiPath + '/signup', signup);
app.use(config.apiPath + '/users', users);
app.use(config.apiPath + '/login', login);
app.use(config.apiPath + '/logout', logout);
app.use(config.apiPath + '/roles', roles);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {

// production error handler
// no stacktraces leaked to user
    app.use(function (err, req, res) {
        res.status(err.status || 500).send({message: err.message});
    });
}

module.exports = app;
