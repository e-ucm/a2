'use strict';

var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    jwt = require('express-jwt'),
    TokenStorage = require('./tokenStorage/token-storage');

var config = require((process.env.NODE_ENV === 'test') ? './config-test' : './config'),
    health = require('./routes/health'),
    applications = require('./routes/applications'),
    views = require('./routes/index'),
    contact = require('./routes/contact'),
    signup = require('./routes/signup'),
    users = require('./routes/users'),
    roles = require('./routes/roles'),
    login = require('./routes/login'),
    logout = require('./routes/logout'),
    proxy = require('./routes/proxy');

var app = express();

var RedisBackend = require('./tokenStorage/redis-backend');
var backend = new RedisBackend(config.redisdb);
var tokenStorage = new TokenStorage(backend);

// Keep reference to config
app.config = config;

app.tokenStorage = tokenStorage;

// Setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');

mongoose.set('debug', app.get('env') === 'development');
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.on('connected', function () {
    console.log('Mongo db Connected!');
    require('./roles')(app);
});
// Config data models
require('./models')(app, mongoose);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
if (app.get('env') === 'development') {
    app.use(logger('dev'));
}

// enable cross-origin resource sharing - CORS http://enable-cors.org/index.html
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Authorization2');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Credentials', true);

    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

var jwtCheck = jwt({
    secret: config.cryptoKey
});

var jwtMiddleware = jwtCheck.unless({
    path: [
        // REST API: match some unprotected routes such as /contact, /login, /signup, etc.
        config.apiPath + '/health',
        config.apiPath + '/contact',
        config.apiPath + '/login',
        config.apiPath + '/login/forgot',
        new RegExp(config.apiPath + '\/login\/reset\/.*'),
        config.apiPath + '/signup'
    ]
});

/**
 * The proxy middleware must be executed before the body-parser middleware.
 * This is because the body-parser will consume the request stream in order to
 * create a new request object. This will conflict with the proxy when the
 * requests have a JSON body (e.g. POST methods with a JSON body).
 */
app.use(config.apiPath + '/proxy', proxy(jwtMiddleware));

app.use(config.apiPath + '/*', jwtMiddleware);

app.use(function (req, res, next) {
    if (req.user) {
        return tokenStorage.middleware(req, res, next);
    }
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.passport = passport;

require('./passport')(app);

app.use(function (req, res, next) {
    res.sendDefaultSuccessMessage = function () {
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
app.use(config.apiPath + '/applications', applications);
app.use(config.apiPath + '/health', health);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handlers
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500).send({
        message: err.message
    });
});

module.exports = app;
