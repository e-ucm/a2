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
    router = express.Router(),
    httpProxy = require('http-proxy'),
    proxyOptions = {},
    pathToRe = require('path-to-regexp'),
    bodyParser = require('body-parser'),
    proxy = httpProxy.createProxyServer(proxyOptions);

var jsonParser;

proxy.on('proxyReq', function (proxyReq, req, res, options) {
    try {
        var forwardHeader = req.headers['x-forwarded-host'];
        var forwardProtocol = req.headers['x-forwarded-proto'];

        var host = req.get('host');
        if (forwardHeader) {
            host = req.headers['x-forwarded-host'];
        }
        proxyReq.setHeader('x-forwarded-host', host);

        if (!forwardProtocol) {
            var hostProtocol = req.protocol;
            proxyReq.setHeader('x-forwarded-proto', hostProtocol);
        } else {
            proxyReq.setHeader('x-forwarded-proto', forwardProtocol);
        }
        if (req.user) {
            var username = req.user.username;
            proxyReq.setHeader('X-Gleaner-User', username);
        }
        if (req.body) {
            var bodyData = JSON.stringify(req.body);
            // Incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // Stream the content
            proxyReq.write(bodyData);
        }
    } catch (err) {
        console.error(err);
    }
});

module.exports = function (jwtMiddleware) {

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

        req.url = '';

        proxy.web(req, res, {
            target: host,
            ignorePath: false,
            changeOrigin: true,
            prependPath: true,
            toProxy: true
        }, function (err) {
            if (err) {
                err.status = 503;
                return next(err);
            }
        });

    };

    var checkLookup = function (application, req, res, next, key, user, lookupObject) {
        return function (err) {
            if (!err) {
                var keys = key.split('.');
                var keyValue = req.body;
                var values = checkChildren(keyValue, 0, keys);
                if (values) {
                    var permissions = lookupObject.permissions;
                    if (permissions) {
                        var allowedKeys = permissions[user];
                        if (allowedKeys) {
                            var allowed = true;
                            values.forEach(function (val) {
                                allowed = allowedKeys.indexOf(val) !== -1;
                                if (!allowed) {
                                    return;
                                }
                            });

                            if (allowed) {
                                return proxyRequest(application, req, res, next, true);
                            }
                        }
                    }
                }
            }

            res.status(403).json({
                message: 'No permission to access the resource'
            });
        };
    };

    var checkChildren = function (obj, currentKey, keys) {
        var finalValues = [];

        auxiliarCheckFunction(obj, currentKey, keys, finalValues);

        return finalValues;
    };

    var auxiliarCheckFunction = function (obj, currentKey, keys, finalValues) {
        obj = obj[keys[currentKey]];
        if (!obj) {
            return finalValues;
        }
        if (obj.constructor === Array) {
            var newIndex = currentKey + 1;
            obj.forEach(function (o) {
                var othersValues = auxiliarCheckFunction(o, newIndex, keys, finalValues);
                finalValues = finalValues.concat(othersValues);
            });
        } else {
            finalValues.push(obj);
        }
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

                var lookup = application.look;
                var option = {
                    sensitive: true,
                    strict: false,
                    end: true
                };

                var route = req.params[0];

                // Search the route in the lookup object
                // (In the positive case, check if the specific user can access to the specific resource)
                if (lookup) {
                    for (var j = 0; j < lookup.length; ++j) {
                        var lookupObject = lookup[j];
                        var url = lookupObject.url;
                        if (!url) {
                            continue;
                        }

                        var urlRegExp = pathToRe(url, [], option);
                        var urlMatch = urlRegExp.exec(route);
                        if (urlMatch) {
                            var methods = lookupObject.methods;
                            if (methods) {
                                var reqMethod = req.method;
                                if (methods.indexOf(reqMethod.toLowerCase()) !== -1) {
                                    var key = lookupObject.key;
                                    if (key) {
                                        req.headers.authorization = 'Bearer ' + req.cookies.rageUserCookie;
                                        return checkJwt(req, res, next, application, key, lookupObject);
                                    }
                                }
                            }
                            break;
                        }
                    }
                }

                // Search the route in the anonymous object
                // (In the positive case, the route doesn't has restrictions)
                var anonymous = application.anonymous;
                if (anonymous) {
                    var jwtCallback = function (err) {
                        if (req.user) {
                            return req.app.tokenStorage.middleware(req, res, function (err) {
                                if (err) {
                                    return next(err);
                                }
                                return proxyRequest(application, req, res, next, true);
                            });
                        }
                        return proxyRequest(application, req, res, next, true);
                    };
                    for (var i = 0; i < anonymous.length; ++i) {
                        var path = anonymous[i];
                        if (!path) {
                            continue;
                        }

                        var regExp = pathToRe(path, [], option);
                        var match = regExp.exec(route);
                        if (match) {
                            return jwtMiddleware(req, res, jwtCallback);
                        }
                    }
                }

                jwtMiddleware(req, res, function (err) {
                    if (err) {
                        return next(err);
                    }
                    if (req.user) {
                        req.app.tokenStorage.middleware(req, res, function (err) {
                            if (err) {
                                return next(err);
                            }

                            proxyRequest(application, req, res, next, false);
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

    var checkJwt = function (req, res, next, application, key, lookupObject) {
        jwtMiddleware(req, res, function (err) {
            if (err) {
                return next(err);
            }
            if (req.user) {
                req.app.tokenStorage.middleware(req, res, function (err) {
                    if (err) {
                        return next(err);
                    }
                    if (!jsonParser) {
                        jsonParser = bodyParser.json({limit: req.app.config.maxSizeVisualizations});
                    }
                    return jsonParser(req, null, checkLookup(application, req, res, next, key, req.user.username, lookupObject));
                });
            } else {
                err = new Error('User is not authenticated!');
                err.status = 400;
                return next(err);
            }

        });
    };

    return router;
};
