'use strict';

var express = require('express'),
    authentication = require('../util/authentication'),
    async = require('async'),
    router = express.Router();

/**
 * @api {get} /roles Return the all roles.
 * @apiName GetRoles
 * @apiGroup Roles
 *
 * @apiSuccess(200) {String} Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "Role1",
 *          "Role2",
 *          "Role3"
 *      ]
 *
 */
router.get('/', authentication.authorized, function (req, res, next) {

    req.app.acl.listRoles(function (err, roles) {
        if (err) {
            return next(err);
        }

        res.json(roles);
    });
});

/**
 * @api {post} /roles Creates new roles.
 * @apiName PostRoles
 * @apiGroup Roles
 *
 * @apiParam {String} roles Role name.
 * @apiParam {Object[]} allows Object with resources and permissions.
 *
 * @apiParam {String} roles Role name.
 * @apiParam {String[]} resources Role resources.
 * @apiParam {String[]} permissions Resources permissions
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "roles":"newRole",
 *          "allows":[
 *              {"resources":"resource-1", "permissions":["perm-1", "perm-3"]},
 *              {"resources":["resource-2","resource-3"], "permissions":["perm-1"]}
 *          ]
 *      }
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "roles": "newRole",
 *          "resources": [
 *              "resource-1",
 *              "resource-2",
 *              "resource-3"
 *      ],
 *          "permissions": [
 *               "permission-1",
 *               "permission-2",
 *               "permission-3"
 *          ]
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "Role1",
 *          "Role2",
 *          "newRole"
 *      ]
 *
 * @apiError(400) RolesRequired Roles required!.
 *
 * @apiError(400) RequiredResourcesAndPermissions Allows, or Resources and Permissions required!.
 *
 * @apiError(400) RoleExists The role {roleName} already exists.
 *
 */
router.post('/', authentication.authorized, function (req, res, next) {
    async.auto({
        validate: function (done) {
            var roleName = req.body.roles;
            var err;
            if (!roleName) {
                err = new Error('Roles required!');
                err.status = 400;
                return done(err);
            }

            if (!req.body.allows && (!req.body.resources || !req.body.permissions)) {
                err = new Error('Allows, or Resources and Permissions required!');
                err.status = 400;
                return done(err);
            }

            req.app.acl.listRoles(function (err, roles) {
                if (err) {
                    return done(err);
                }

                if (roles.indexOf(roleName) !== -1) {
                    err = new Error("The role " + roleName + " already exists.");
                    err.status = 400;
                    return done(err);
                }

                done();
            });
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
                return next(err);
            }

            res.json(roles);
        });
    });
});

/**
 * @api {get} /roles/:roleName Returns the resources and permissions of role roleName
 * @apiName GetResources
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *         "resources-1": [
 *              "permission-1"
 *              "permission-2",
 *              "permission-3"
 *         ],
 *         "resources-2": [
 *              "permission-3"
 *          ],
 *          "resources-3": [
 *              "permission-1",
 *              "permission-3"
 *          ],
 *      }
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) RoleExists The role {roleName}  doesn't exist.
 *
 */
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
                if (JSON.stringify(result) === "{}") {
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

/**
 * @api {delete} /roles/:roleName Deletes the role with roleName.
 * @apiName DelRole
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "Admin"
 *      ]
 *
 * @apiError(400) RolesRequired Roles required!.
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) RequiredResourcesAndPermissions Allows, or Resources and Permissions required!.
 *
 * @apiError(400) RoleExists The role {roleName} already exists.
 *
 */
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

/**
 * @api {post} /roles/:roleName/resources Creates new resource with permissions for a role.
 * @apiName PostResources
 * @apiGroup Roles
 *
 * @apiParam {Object[]} allows Object with resources and permissions.
 *
 * @apiParam {String[]} resources Role resources.
 * @apiParam {String[]} permissions Resources permissions
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "allows":[
 *              {
 *                  "resources":"resource-1",
 *                  "permissions":[
 *                      "perm-1",
 *                      "perm-3"
 *                  ]
 *              },
 *              {
 *                  "resources":[
 *                      "resource-2",
 *                      "resource-3"
 *                  ],
 *                  "permissions":["perm-1"]
 *              }
 *          ]
 *      }
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "resources": [
 *              "resource-1",
 *              "resource-2",
 *              "resource-3"
 *      ],
 *          "permissions": [
 *               "permission-1",
 *               "permission-2",
 *               "permission-3"
 *          ]
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *         "resources-1": [
 *              "perm-1"
 *              "perm-3"
 *         ],
 *         "resources-2": [
 *              "perm-1"
 *          ],
 *          "resources-3": [
 *              "perm-1"
 *          ]
 *      }
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) RequiredResourcesAndPermissions Allows, or Resources and Permissions required!.
 *
 */
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
        checkRole: ['validate', function (done) {
            existsRole(req, roleName, done);
        }],
        addResources: ['checkRole', function (done) {
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
            res.json(result);
        });
    });
});

/**
 * @api {delete} /roles/:roleName/resources/:resourceName Deletes the resource with resourceName in roleName role
 * @apiName DelResource
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 * @apiParam {String} resourceName Resource to delete.
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *         "resources-1": [
 *              "perm-1"
 *              "perm-3"
 *         ]
 *      }
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) ResourceDoesNotExist The resource in the role doesn't exist.
 *
 */
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

                    done(null, result[resource]);
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
            res.json(result);
        });
    });
});

/**
 * @api {get} /roles/:roleName/resources/:resourceName Returns the permissions of resource resourceName in role roleName.
 * @apiName GetResources
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 * @apiParam {String} resourceName Resource name.
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "permission1",
 *          "permission2",
 *          "permission3"
 *      ]
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) ResourceDoesNotExist The resource in role doesn't exist.
 *
 */
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

/**
 * @api {post} /roles/:roleName/resources/:resourceName/permissions Creates new permissions.
 * @apiName PostPermissions
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 * @apiParam {String} resourceName Resource name.
 * @apiParam {String[]} permissions The new permissions.
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "permission" : [
 *              "perm-1",
 *              "perm-3"
 *          ]
 *      }
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "permission",
 *          "perm-1",
 *          "perm-2"
 *      ]
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) PermissionRequired Permissions required!.
 *
 * @apiError(400) ResourceDoesNotExist The resource in role doesn't exist.
 *
 */
router.post('/:roleName/resources/:resourceName/permissions', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params.resourceName || '';

    async.auto({
        checkRole: function (done) {
            existsRole(req, roleName, done);
        },
        validate: ['checkRole', function (done) {
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
        }],
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
            res.json(result[resource]);
        });
    });
});

/**
 * @api {delete} /roles/:roleName/resources/:resourceName/permissions/:permissionName Deletes a permission
 * @apiName DelPermission
 * @apiGroup Roles
 *
 * @apiParam {String} roleName Role name.
 * @apiParam {String} resourceName Resource name.
 * @apiParam {String} permissionName The permissions to delete.
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "permission-1",
 *          "permission-2",
 *          "permission-3"
 *      ]
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 * @apiError(400) PermissionDoesNotExist The permission of the resource doesn't exist.
 *
 * @apiError(400) ResourceDoesNotExist The resource in role doesn't exist.
 *
 * @apiError(403) LastPermission The permission can't be remove because is the last
 *
 */
router.delete('/:roleName/resources/:resourceName/permissions/:permissionName', authentication.authorized, function (req, res, next) {
    var roleName = req.params.roleName || '';
    var resource = req.params.resourceName || '';
    var permission = req.params.permissionName || '';

    async.auto({
        checkRole: function (done) {
            existsRole(req, roleName, done);
        },
        validate: ['checkRole', function (done) {
            req.app.acl.whatResources(roleName, function (err, result) {
                if (err) {
                    return done(err);
                }
                if (!result[resource]) {
                    err = new Error('The resource ' + resource + ' in ' + roleName + " doesn't exist.");
                    err.status = 400;
                    return done(err);
                }

                if (result[resource].length < 2) {
                    err = new Error("The permission " + permission + " can't be remove because is the last");
                    err.status = 400;
                    return done(err);
                } else if (result[resource].indexOf(permission) === -1) {
                    err = new Error("The permission " + permission + ' in the resource ' + resource + ' in ' + roleName + " doesn't exist.");
                    err.status = 400;
                    return done(err);
                }
                done();
            });
        }],
        removePermissions: ['validate', function (done) {
            req.app.acl.removeAllow(roleName, resource, permission, function (err) {
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
        req.app.acl.whatResources(roleName, function (err, result) {
            if (err) {
                return next(err);
            }
            res.send(result[resource] || []);
        });
    });
});

/**
 * @api {get} /roles/:roleName/users Return the username of user with the role.
 * @apiName GetRoleUsers
 * @apiGroup Roles
 *
 * @apiParam {String} roles Role name.
 *
 * @apiSuccess(200) Success.
 *
 * @apiSuccessExample Success-Response:
 *      HTTP/1.1 200 OK
 *      [
 *          "user1",
 *          "user2",
 *          "user3"
 *      ]
 *
 * @apiError(400) RolesDoesNotExist The role doesn't exist.
 *
 */
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

        if (roles.indexOf(roleName) === -1) {
            err = new Error("The role " + roleName + " doesn't exist.");
            err.status = 400;
            return cb(err);
        }

        cb();
    });
}

module.exports = router;