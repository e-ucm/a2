'use strict';

var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    http = require('http');

var config = require('./config'),
    routes = require('./routes/index'),
    contact = require('./routes/contact'),
    signup = require('./routes/signup'),
    users = require('./routes/users'),
    login = require('./routes/login'),
    logout = require('./routes/logout');


var app = express();

//keep reference to config
app.config = config;

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');

app.server = http.createServer(app);

app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.on('connected', function() {
    console.log('Mongo db Connected!');
    require('./roles')(app);
});
//config data models
require('./models')(app, mongoose);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: config.cryptoKey,
    resave: false,
    saveUninitialized: false,
    store: new mongoStore({mongooseConnection: app.db})
}));
app.use(passport.initialize());
app.use(passport.session());
app.passport = passport;

require('./passport')(app);

app.use(config.apiPath, routes);
app.use(config.apiPath + '/contact', contact);
app.use(config.apiPath + '/signup', signup);
app.use(config.apiPath + '/users', users);
app.use(config.apiPath + '/login', login);
app.use(config.apiPath + '/logout', logout);

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
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500).send({message : err.message});
});

//listen up
app.server.listen(config.port, function () {
    //and... we're live
    console.log('Server is running on port ' + config.port);
});

module.exports = app;
