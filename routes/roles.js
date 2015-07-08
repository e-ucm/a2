'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    async = require('async'),
    router = express.Router();

/* GET roles. */
router.get('/', authentication.authorized, function (req, res, next) {

    req.app.acl.listRoles(function (err, roles) {
        if (err) {
            return next(err)
        }

        res.json(roles)
    });
});

/* POST roles, create a new role. */
router.post('/', authentication.authorized, function (req, res, next) {
    async.auto({
        validate: function (done) {
            var roleName = req.body.roles;
            if (!roleName) {
                var err = new Error('Roles required!');
                err.status = 400;
                return done(err);
            }

            if (!req.body.allows && (!req.body.resources || !req.body.permissions)) {
                var err = new Error('Allows, or Resources and Permissions required!');
                err.status = 400;
                return done(err);
            }

            req.app.acl.listRoles(function (err, roles) {
                if (err) {
                    return done(err);
                }

                if (roles.indexOf(roleName) != -1) {
                    err = new Error("The role " + roleName + " already exists.");
                    err.status = 400;
                    return done(err);
                }

                done();
            })
        },
        addRole: ['validate', function (done) {
            if (req.body.allows) {
                req.app.acl.allow([req.body], function (err, result) {
                    done(err, result);
                });
            } else {
                req.app.acl.allow(req.body.roles, req.body.resources, req.body.permissions, function (err, result) {
                    done(err, result);
                });
            }
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.listRoles(function (err, roles) {
            if (err) {
                return next(err)
            }

            res.json(roles)
        });
    });
});

/* GET permissions and resources of a role. */
router.get('/:roleName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    async.auto({
        validate: function (done) {
            existsRole(req, roleName, done);
        },
        get: ['validate', function (done) {
            req.app.acl.whatResources(roleName, function (err, result) {
                if (err) {
                    done(err);
                }
                if (JSON.stringify(result) == "{}") {
                    err = new Error("The role " + roleName + " doesn't exist.");
                    err.status = 400;
                    return next(err);
                }
                done(null, result);
            });
        }]
    }, function (err, result) {
        if (err) {
            return next(err);
        }
        res.json(result.get);
    });

});

/* DELETE role. */
router.delete('/:roleName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    async.auto({
        validate: function (done) {
            if (roleName === 'admin') {
                var err = new Error("The role " + roleName + " is indestructible");
                err.status = 403;
                return done(err);
            }

            existsRole(req, roleName, done);
        },
        delete: ['validate', function (done) {
            req.app.acl.removeRole(roleName, function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.listRoles(function (err, roles) {
            if (err) {
                return next(err);
            }
            res.json(roles);
        });
    });
});

/* POST resource. Add a new resource in a role */
router.post('/:roleName/resources', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    async.auto({
        validate: function (done) {
            if (!req.body.allows && (!req.body.resources || !req.body.permissions)) {
                var error = new Error('Allows, or Resources and Permissions required!');
                error.status = 400;
                return done(error);
            }

            done();
        },
        addResources: ['validate', function (done) {
            if (req.body.allows) {
                var role = req.body;
                role.roles = roleName;
                req.app.acl.allow([role], done);
            } else {
                req.app.acl.allow(roleName, req.body.resources, req.body.permissions, done);
            }
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }
            res.json(result)
        });
    });
});

/* DELETE resource of role. */
router.delete('/:roleName/resources/:resourceName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params.resourceName || '';

    async.auto({
        validate: function (done) {
            existsRole(req, roleName, function (err) {
                if (err) {
                    return done(err);
                }

                req.app.acl.whatResources(roleName, function (err, result) {
                    if (err) {
                        return next(err);
                    }

                    if (!result[resource]) {
                        err = new Error('The resource ' + resource + ' in ' + roleName + " doesn't exist.");
                        err.status = 400;
                        return done(err);
                    }

                    done(null, result[resource])
                });
            });
        },
        deleteResources: ['validate', function (done, results) {
            req.app.acl.removeAllow(roleName, resource, results.validate, done);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }
            res.json(result)
        });
    });
});

/* GET permissions of resource in a role. */
router.get('/:roleName/resources/:resourceName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params.resourceName || '';

    existsRole(req, roleName, function (err) {
        if (err) {
            return next(err);
        }

        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }

            if (!result[resource]) {
                err = new Error('The resource ' + resource + ' in ' + roleName + " doesn't exist.");
                err.status = 400;
                return next(err);
            }

            res.json(result[resource]);
        });
    });
});

/* POST permissions. Add a new permissions in resource of role */
router.post('/:roleName/resources/:resourceName/permissions', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params.resourceName || '';

    async.auto({
        validate: function (done) {
            if (!req.body.permissions) {
                var err = new Error('Permissions required!');
                err.status = 400;
                return done(err);
            }

            req.app.acl.whatResources(roleName, function (err, result) {
                if (err) {
                    return done(err);
                }

                if (!result[resource]) {
                    err = new Error('The resource ' + resource + ' in ' + roleName + " doesn't exist.");
                    err.status = 400;
                    return done(err);
                }

                return done();
            });
        },
        addPermissions: ['validate', function (done) {
            req.app.acl.allow(roleName, resource, req.body.permissions, done);
        }]
    }, function (err) {
        if (err) {
            return next(err);
        }
        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }
            res.json(result[resource])
        });
    });
});

/* DEL permission. Remove the permission in resource of role */
router.delete('/:roleName/resources/:resourceName/permissions/:permissionName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params.resourceName || '';
    var permission = req.params.permissionName || '';

    req.app.acl.whatResources(roleName, function (err, result) {
        if (err) {
            return next(err);
        }
        if (!result[resource]) {
            err = new Error('The resource ' + resource + ' in ' + roleName + " doesn't exist.");
            err.status = 400;
            return next(err);
        }

        if (result[resource].length < 2) {
            err = new Error("The permission " + permission + " can't be remove because is the last");
            err.status = 400;
            return next(err);
        } else if (result[resource].indexOf(permission) == -1) {
            err = new Error("The permission " + permission + ' in the resource ' + resource + ' in ' + roleName + " doesn't exist.");
            err.status = 400;
            return next(err);
        }

        req.app.acl.removeAllow(roleName, resource, permission, function (err) {
            if (err) {
                return next(err);
            }
            req.app.acl.whatResources(roleName, function (err, result) {
                if (err) {
                    return next(err);
                }
                res.json(result[resource] || [])
            });
        });
    });
});

/* GET the username of all users that have the role. */
router.get('/:roleName/users', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';

    existsRole(req, roleName, function (err) {
        if (err) {
            return next(err);
        }

        req.app.acl.roleUsers(roleName, function (err, users) {
            if (err) {
                return next(err);
            }

            res.json(users);
        });
    });
});

/**
 * Return a Error if the role doesn't exist
 */
function existsRole(req, roleName, cb) {
    req.app.acl.listRoles(function (err, roles) {
        if (err) {
            return cb(err);
        }

        if (roles.indexOf(roleName) == -1) {
            err = new Error("The role " + roleName + " doesn't exist.");
            err.status = 400;
            return cb(err);
        }

        cb();
    })
}

module.exports = router;