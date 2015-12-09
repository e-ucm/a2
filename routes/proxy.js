'use strict';

var express = require('express'),
    router = express.Router(),
    httpProxy = require('http-proxy'),
    proxyOptions = {},
    pathToRe = require('path-to-regexp'),
    proxy = httpProxy.createProxyServer(proxyOptions);

proxy.on('proxyRes', function () {
    proxy.removeAllListeners('proxyReq');
});

exports = module.exports = function (jwtMiddleware) {

    var startsWith = function (source, str) {
        return source.slice(0, str.length) === str;
    };

    var endsWith = function (source, str) {
        return source.slice(-str.length) === str;
    };

    var proxyRequest = function (application, req, res, next, forward) {
        var host = application.host;
        if (host) {
            if (forward) {
                return forwardRequest(host, req, res, next);
            }

            var resource = application.prefix + req.params[0];
            var action = req.method.toLowerCase();
            var userId = req.user.username;

            var routes = application.routes;
            if (routes) {
                var options = {
                    sensitive: true,
                    strict: false,
                    end: true
                };
                for (var i = 0; i < routes.length; ++i) {
                    var path = routes[i];
                    if (!path) {
                        continue;
                    }

                    var regExp = pathToRe(path, [], options);
                    var match = regExp.exec(resource);
                    if (match) {
                        resource = path;
                        break;
                    }
                }
            }

            req.app.acl.isAllowed(userId, resource, action, function (err, allowed) {
                if (err) {
                    return next(err);
                }
                if (allowed === false) {
                    if (req.app.acl.logger) {
                        req.app.acl.logger.debug('Not allowed ' + action + ' on ' + resource + ' by user ' + userId);
                    }
                    err = new Error('Insufficient permissions to access resource');
                    err.status = 403;
                    return next(err);
                }
                if (req.app.acl.logger) {
                    req.app.acl.logger.debug('Allowed ' + action + ' on ' + resource + ' by user ' + userId);
                }

                forwardRequest(host, req, res, next);

            });
        } else {
            var appName = application.name;
            if (!appName) {
                appName = application.prefix;
            } else {
                appName += ' (' + application.prefix + ')';
            }
            var err = new Error('It seems that the application ' + appName + ' has an undefined host.');
            err.status = 400;
            return next(err);
        }
    };

    var forwardRequest = function (host, req, res, next) {

        if (!startsWith(host, 'http')) {
            host = 'http://' + host;
        }

        if (endsWith(host, '/')) {
            host = host.slice(0, host.length - 1);
        }

        host += req.params[0];

        if (req._parsedUrl.search) {
            host += req._parsedUrl.search;
        }

        if (req.user) {
            var username = req.user.username;
            proxy.on('proxyReq', function (proxyReq, req, res, options) {
                proxyReq.setHeader('X-Gleaner-User', username);
            });
        }

        proxy.web(req, res, {
            target: host,
            ignorePath: true,
            changeOrigin: true
        }, function (err) {
            if (err) {
                err.status = 503;
                return next(err);
            }
        });
    };

    /**
     * @api {post} /proxy/:prefix* Proxy everything that goes after :prefix to the application registered with the given prefix.
     * @apiName Proxy
     * @apiGroup Proxy
     *
     * @apiParam {String} prefix The unique prefix of a previously registered application.
     * @apiParam {String} ANY_ROUTE Relevant for the API this request will be forwarded to. The target API will receive this route.
     *
     * @apiPermission none
     *
     * @apiParamExample {json} Request-Example:
     *
     *      Asuming we already have a registered application with the following data:
     *
     *          prefix: gleaner
     *          host: localhost:3300
     *          name: Gleaner App.
     *
     *      Given the following request GET /api/gleaner/traces/:traceId where:
     *
     *          gleaner is the prefix for the Gleaner App.
     *          /traces/:traceId is the extracted route from the request.
     *
     *      This request will be forwarded to the following address:
     *
     *          http://localhost:3300/traces:traceId
     *
     *      with...
     *
     *      {
     *          ...data relevant to the parameter that goes after prefix...
     *      }
     *
     * @apiSuccess(200) Success.
     *
     * @apiSuccessExample Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          ...data provided by the application this request was forwarded to...
     *      }
     *
     * @apiError(400) InvalidPrefix You must provide a valid prefix!
     *
     * @apiError(400) ApplicationNotFound No application found with the given prefix: <prefix>
     *
     * @apiError(400) UndefinedHost It seems that the application <appName> has an undefined host.
     *
     */
    router.all('/:prefix*', function (req, res, next) {
        var prefix = req.params.prefix;
        if (prefix) {
            req.app.db.model('application').findByPrefix(prefix, function (err, application) {
                if (err) {
                    return next(err);
                }
                if (!application) {
                    err = new Error('No application found with the given prefix: ' + prefix);
                    err.status = 400;
                    return next(err);
                }

                var anonymous = application.anonymous;
                var forward = false;
                if (anonymous) {
                    var appRoute = req.params[0];
                    var options = {
                        sensitive: true,
                        strict: false,
                        end: true
                    };
                    for (var i = 0; i < anonymous.length; ++i) {
                        var path = anonymous[i];
                        if (!path) {
                            continue;
                        }

                        var regExp = pathToRe(path, [], options);

                        var match = regExp.exec(appRoute);
                        if (match) {
                            forward = true;
                            break;
                        }
                    }
                }

                jwtMiddleware(req, res, function (err) {
                    if (err) {
                        return forward ? proxyRequest(application, req, res, next, forward) : next(err);
                    }
                    if (req.user) {
                        req.app.tokenStorage.middleware(req, res, function (err) {
                            if (err) {
                                return forward ? proxyRequest(application, req, res, next, forward) : next(err);
                            }

                            proxyRequest(application, req, res, next, forward);
                        });
                    } else {
                        err = new Error('User is not authenticated!');
                        err.status = 400;
                        return next(err);
                    }
                });
            });
        } else {
            var err = new Error('You must provide a valid prefix!');
            err.status = 400;
            return next(err);
        }
    });

    return router;
};