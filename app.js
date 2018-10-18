/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    jwt = require('express-jwt'),
    TokenStorage = require('./tokenStorage/token-storage'),
    status = require('http-status');

var config = require((process.env.NODE_ENV === 'test') ? './config-test' : './config'),
    health = require('./routes/health'),
    applications = require('./routes/applications'),
    views = require('./routes/index'),
    contact = require('./routes/contact'),
    signup = require('./routes/signup'),
    users = require('./routes/users'),
    roles = require('./routes/roles'),
    login = require('./routes/login'),
    loginPlugins = require('./routes/loginPlugins'),
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

app.enable('trust proxy');

// Enable cross-origin resource sharing - CORS http://enable-cors.org/index.html
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('X-Frame-Options', 'ALLOWALL');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Credentials', true);

    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

var jwtCheck = jwt({
    secret: config.cryptoKey,
    algorithms: ['HS256']
});

var jwtMiddleware = jwtCheck.unless({
    path: [
        // REST API: match some unprotected routes such as /contact, /login, /signup, etc.
        config.apiPath + '/health',
        config.apiPath + '/contact',
        config.apiPath + '/login',
        config.apiPath + '/loginplugins',
        new RegExp(config.apiPath + '\/login\/.*'),
        config.apiPath + '/signup'
    ]
});

app.use(cookieParser());

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

app.use(bodyParser.json({limit: config.maxSizeRequest}));
app.use(bodyParser.urlencoded({extended: false, limit: config.maxSizeRequest}));
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
loginPlugins.setupLoginPlugins(app);
app.use(config.apiPath + '/loginplugins', loginPlugins.router);
app.use(config.apiPath + '/logout', logout);
app.use(config.apiPath + '/roles', roles);
app.use(config.apiPath + '/applications', applications);
app.use(config.apiPath + '/health', health);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = err.status || 404;
    next(err);
});

// Error handlers
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {

    err.status = err.status || 500;

    err.descriptiveTitle = status[err.status];
    err.descriptiveTitle = err.descriptiveTitle || 'An unknown error has occurred';
    err.descriptiveSubtitle = status[err.status + '_MESSAGE'];
    err.descriptiveSubtitle = err.descriptiveSubtitle || 'An unexpected condition was encountered and we are now sure what has happened';

    // Respond with html page
    if (req.accepts('html')) {
        res.status(err.status).render('error', { error: err, url: req.url });
        return;
    }

    // Respond with json
    if (req.accepts('json')) {
        res.json({ error: 'Not found' });
        return;
    }

    // Default to plain-text. send()
    res.type('txt').send('Not found');
});

module.exports = app;
