'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngStorage'])

    .controller('ToolbarCtrl', ['$scope', '$http', '$window', '$timeout', '$localStorage',
        function ($scope, $http, $window, $timeout, $localStorage) {
            $scope.$storage = $localStorage;

            $scope.isAdmin = function () {
                return $scope.isUser() &&
                    $scope.$storage.user.roles && $scope.$storage.user.roles.indexOf('admin') !== -1;
            };

            $scope.isUser = function () {
                return $scope.$storage && $scope.$storage.user;
            };

            $scope.seeProfile = function () {
                $scope.href('/users/' + $scope.$storage.user._id);
            };

            $scope.href = function (href) {
                $window.location.href = href;
            };

            $scope.logout = function () {
                $http.delete('/api/logout', {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    delete $scope.$storage.user;
                    $timeout(function () {
                        $scope.href('/login');
                    }, 110);
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ToolbarCtrl, GET /api/logout \n', data);
                });
            };

        }])

    .controller('LoginCtrl', ['$scope', '$http', '$window', '$timeout', '$localStorage',
        function ($scope, $http, $window, $timeout, $localStorage) {
            $scope.$storage = $localStorage;

            $scope.login = function () {

                $http.post('/api/login', $scope.user).success(function (data) {
                    $localStorage.$reset();
                    $scope.$storage.user = data.user;

                    $http.get('/api/users/' + data.user._id + '/roles', {
                        headers: {
                            'Authorization': 'Bearer ' + $scope.$storage.user.token
                        }
                    }).success(function (data) {
                        $scope.$storage.user.roles = data;
                        // Timeout needed in order to ensure that the
                        // $localStorage changes are persisted, more info. at
                        // https://github.com/gsklee/ngStorage/issues/39
                        $timeout(function () {
                            $window.location.href = '/users/' + $scope.$storage.user._id;
                        }, 110);
                    }).error(function (data, status) {
                        console.error('Status:', status, ', Error on LoginCtrl, GET /api/users/' + data.user._id + '/roles \n', data);

                    });
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on LoginCtrl, POST /api/login \n', data);
                });
            };
        }])

    .controller('SignupCtrl', ['$scope', '$http', '$window',
        function ($scope, $http, $window) {

            $scope.repeatedPassword = '';
            $scope.errorResponse = '';
            var showAlert = false;
            $scope.signup = function () {
                showAlert = true;
                if ($scope.isValidPassword() && !$scope.isEmpty($scope.user.username) && !$scope.isEmpty($scope.user.email)) {
                    $http.post('/api/signup', $scope.user).success(function () {
                        $scope.errorResponse = '';
                        $window.location.href = '/login';
                    }).error(function (data, status) {
                        console.error('Status:', status, ', Error on SignupCtrl, POST /signup \n', data);
                        $scope.errorResponse = data.message;
                    });
                }
            };

            $scope.isValidPassword = function () {
                return !showAlert || $scope.user && $scope.repeatedPassword !== '' && $scope.user.password === $scope.repeatedPassword;
            };

            $scope.isEmpty = function (data) {
                return showAlert && (!data || data === '');
            };
        }])

    .controller('ResetCtrl', ['$scope', '$http', '$window',
        function ($scope, $http, $window) {

            $scope.resetPassword = function () {
                $http.post('/api/login/reset/' + $scope.tkn, $scope.password, {})
                    .success(function () {
                        $window.location.href = '/login';
                    }).error(function (data, status) {
                        console.error('Status:', status, ', Error on ResetCtrl, POST /api/reset/' + $scope.tkn + '\n', data);
                    });
            };
        }])

    .controller('UsersCtrl', ['$scope', '$http', '$window', '$localStorage',
        function ($scope, $http, $window, $localStorage) {
            $scope.$storage = $localStorage;
            var pages;
            var getUsers = function (page) {
                $http.get('/api/users?page=' + page, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.response = data;
                    if (!pages) {
                        $('#user-pag').twbsPagination({
                            totalPages: data.pages.total,
                            visiblePages: 5,
                            onPageClick: function (event, page) {
                                getUsers(page);
                            }
                        });
                    }
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on UsersCtrl, GET /api/users \n', data);
                });

                $scope.edit = function (userId) {
                    $window.location.href = '/users/' + userId;
                };
            };

            getUsers(1);
        }])

    .controller('ApplicationsCtrl', ['$scope', '$http', '$window', '$localStorage',
        function ($scope, $http, $window, $localStorage) {
            $scope.$storage = $localStorage;

            $scope.proxyRoute = $window.location.host + "/proxy/";
            var refresh = function () {

                $http.get('/api/applications', {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.response = data;
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ApplicationsCtrl, GET /api/applications \n', data);
                });
            };

            refresh();

            $scope.applicationRoles = [{
                roles: '',
                allows: [
                    {resourceName: '', permissionName: ''}
                ]
            }];

            $scope.anonymousRoutes = [{
                route: ''
            }];

            $scope.addResourceInput = function (applicationRole) {
                if (applicationRole.allows[applicationRole.allows.length - 1].resourceName !== '') {
                    applicationRole.allows.push({resourceName: '', permissionName: ''});
                }
            };

            $scope.addAnonymousRouteInput = function () {
                if ($scope.anonymousRoutes[$scope.anonymousRoutes.length - 1].route !== '') {
                    $scope.anonymousRoutes.push({route: ''});
                }
            };

            $scope.addRoleInput = function () {
                if ($scope.applicationRoles[$scope.applicationRoles.length - 1].roles !== '') {
                    $scope.applicationRoles.push({
                        roles: '',
                        allows: [
                            {resourceName: '', permissionName: ''}
                        ]
                    });
                }
            };

            $scope.applyChanges = function (application) {

                $http.put('/api/applications/' + application._id, {
                    prefix: application.prefix,
                    host: application.host,
                    name: application.name,
                    anonymous: [application.anonymousRoute]
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ApplicationsCtrl, PUT /api/applications/' + application._id + '\n', data);
                });
            };

            $scope.addApplication = function () {

                var applicationData = {
                    name: $scope.name,
                    prefix: $scope.prefix,
                    host: $scope.host
                };
                if ($scope.applicationRoles[0].roles !== '') {
                    applicationData.roles = [];
                    var i = 0;
                    $scope.applicationRoles.forEach(function (role) {
                        var allows = [];
                        role.allows.forEach(function (allow) {
                            if (allow.resourceName !== '' && allow.permissionName !== '') {
                                allows.push({
                                    resources: [allow.resourceName],
                                    permissions: allow.permissionName.split(' ')
                                });
                            }
                        });
                        applicationData.roles[i] = {};
                        applicationData.roles[i].allows = allows;
                        applicationData.roles[i].roles = role.roles;
                        i++;
                    });
                }
                if ($scope.anonymousRoutes[0].route !== '') {
                    applicationData.anonymous = [];
                    $scope.anonymousRoutes.forEach(function (field) {
                        applicationData.anonymous.push(field.route);
                    });
                }
                $http.post('/api/applications/', applicationData, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    $scope.applicationRoles = [{roles: '', allows: [{resourceName: '', permissionName: ['']}]}];
                    $scope.anonymousRoutes = [{route: ''}];
                    $scope.name = '';
                    $scope.prefix = '';
                    $scope.host = '';
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ApplicationsCtrl, POST /api/applications \n', data);
                });
            };

            $scope.deleteApplication = function (appId) {
                $http.delete('/api/applications/' + appId, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ApplicationsCtrl, DEL /api/applications/' + appId + '\n', data);
                });
            };

            $scope.emotionsApplication = {
                "name": "emotions",
                "prefix": "emotions",
                "host": "http://localhost:3232/api",
                anonymous: [
                    '/emotions'
                ]
            };

            $scope.gleanerApplication = {
                "name": "gleaner",
                "prefix": "gleaner",
                "host": "http://localhost:3300/api",
                "roles": [
                    {
                        "roles": "student",
                        "allows": [
                            {
                                "resources": [
                                    "/games/public",
                                    "/games/:gameId/versions",
                                    "/games/:gameId/versions/:versionId",
                                    "/games/:gameId/versions/:versionId/sessions/my",
                                    "/sessions/:sessionId/results"
                                ],
                                "permissions": [
                                    "get"
                                ]
                            },
                            {
                                "resources": [
                                    "/sessions/:sessionId"
                                ],
                                "permissions": [
                                    "put",
                                    "get"
                                ]
                            }
                        ]
                    },
                    {
                        "roles": "teacher",
                        "allows": [
                            {
                                "resources": [
                                    "/games/public",
                                    "/games/:gameId/versions",
                                    "/games/:gameId/versions/:versionId",
                                    "/games/:gameId/versions/:versionId/sessions/my",
                                    "/sessions/:sessionId/results"

                                ],
                                "permissions": [
                                    "get"
                                ]
                            },
                            {
                                "resources": [
                                    "/sessions/:sessionId",
                                    "/sessions/:sessionId/remove",
                                    "/sessions/:sessionId/results/:resultsId"
                                ],
                                "permissions": [
                                    "*"
                                ]
                            },
                            {
                                "resources": [
                                    "/games/:gameId/versions/:versionId/sessions",
                                    "/sessions/:sessionId/event/:event"
                                ],
                                "permissions": [
                                    "post"
                                ]
                            }
                        ]
                    },
                    {
                        "roles": "developer",
                        "allows": [
                            {
                                "resources": [
                                    "/games/my",
                                    "/games/:gameId",
                                    "/games/:gameId/versions",
                                    "/games/:gameId/versions/:versionId"
                                ],
                                "permissions": [
                                    "*"
                                ]
                            },
                            {
                                "resources": [
                                    "/games/:gameId/versions/:versionId/sessions",
                                    "/sessions/:sessionId"
                                ],
                                "permissions": [
                                    "get"
                                ]
                            },
                            {
                                "resources": [
                                    "/games"
                                ],
                                "permissions": [
                                    "post"
                                ]
                            }
                        ]
                    }
                ],
                anonymous: [
                    '/collector/start/:trackingCode',
                    '/collector/track'
                ],
                autoroles: [
                    'student',
                    'teacher',
                    'developer'
                ]
            };

            $scope.applicationString = JSON.stringify($scope.gleanerApplication, null, 4);

            $scope.addScriptApplication = function () {
                var data = JSON.parse($scope.applicationString);
                $http.post('/api/applications', data, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ApplicationsCtrl, POST /api/applications \n', data);
                });
            };

            $scope.selectApp = function (sctript) {
                $scope.applicationString = JSON.stringify(sctript, null, 4);
            };

        }])

    .controller('RolesCtrl', ['$scope', '$http', '$location', '$localStorage',
        function ($scope, $http, $location, $localStorage) {
            $scope.$storage = $localStorage;

            $scope.newPer = {};
            $scope.newRec = {};
            $scope.newRecPer = {};

            var getRoles = function () {
                $http.get('/api/roles', {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.rolesList = {};
                    data.forEach(function (role) {
                        $scope.rolesList[role] = {
                            name: role
                        };
                        $http.get('/api/roles/' + role, {
                            headers: {
                                'Authorization': 'Bearer ' + $scope.$storage.user.token
                            }
                        }).success(function (data) {
                            $scope.rolesList[role].info = data;
                        }).error(function (data, status) {
                            console.error('Status:', status, ', Error on RolesCtrl, GET /api/roles/' + role + '\n', data);
                        });
                    });
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, GET /api/roles \n', data);

                });
            };

            $scope.newRoleModel = [{resourceName: '', permissionName: ['']}];

            getRoles();

            $scope.addResourceInput = function () {
                if ($scope.newRoleModel[$scope.newRoleModel.length - 1].resourceName !== '') {
                    $scope.newRoleModel.push({resourceName: '', permissionName: ['']});
                }
            };

            $scope.addRole = function (roleName) {
                $scope.allows = [];
                $scope.newRoleModel.forEach(function (resourceModel) {
                    if (resourceModel.resourceName !== '' && resourceModel.permissionName !== ['']) {
                        $scope.allows.push({
                            resources: [resourceModel.resourceName],
                            permissions: resourceModel.permissionName.split(' ')
                        });
                    }
                });
                $scope.item = {
                    roles: $scope.newRole.name,
                    allows: $scope.allows
                };

                $http.post('/api/roles/', $scope.item, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    var role = $scope.rolesList[$scope.newRole.name] = {};
                    role.name = $scope.newRole.name;
                    role.info = {};
                    $scope.newRoleModel.forEach(function (resourceModel) {
                        role.info[resourceModel.resourceName] = resourceModel.permissionName.split(' ');
                    });
                    $scope.newRole.name = '';
                    $scope.newRole.resource = '';
                    $scope.newRole.permission = '';
                    $scope.newRoleModel = [{resourceName: '', permissionName: ['']}];
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, GET /api/roles/' + roleName + ' \n', data);
                });
            };

            $scope.addResource = function (roleName) {
                $scope.item = {resources: [], permissions: []};
                $scope.item.resources.push($scope.newRec[roleName]);
                $scope.item.permissions = $scope.newRecPer[roleName].split(' ');

                $http.post('/api/roles/' + roleName + '/resources', $scope.item, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    var role = $scope.rolesList[roleName] || {};
                    if (!role.info) {
                        role.info = {};
                    }
                    role.info[$scope.newRec[roleName]] = $scope.newRecPer[roleName].split(' ');
                    $scope.newRec[roleName] = '';
                    $scope.newRecPer[roleName] = '';
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, GET /api/roles/' + roleName + '/resources \n', data);
                });
            };

            $scope.addPermission = function (roleName, resourceName) {
                $scope.item = {};
                $scope.item.permissions = $scope.newPer[resourceName].split(' ');
                $http.post('/api/roles/' + roleName + '/resources/' + resourceName + '/permissions', $scope.item, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    var role = $scope.rolesList[roleName].info;
                    role[resourceName] = role[resourceName].concat($scope.newPer[resourceName].split(' '));
                    $scope.newPer[resourceName] = '';
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, POST /api/roles/' + roleName + '/resources/' + resourceName + '/permissions \n', data);
                });
            };

            $scope.removeRole = function (roleName) {
                $http.delete('/api/roles/' + roleName, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    delete $scope.rolesList[roleName];
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, POST /api/roles/' + roleName + '\n', data);
                });
            };

            $scope.removeResource = function (roleName, resourceName) {
                $http.delete('/api/roles/' + roleName + '/resources/' + resourceName, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    delete $scope.rolesList[roleName].info[resourceName];
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, DEL /api/roles/' + roleName + '/resources/' + resourceName + '\n', data);
                });
            };

            $scope.removePermission = function (roleName, resourceName, permission) {
                var role = $scope.rolesList[roleName].info;
                $http.delete('/api/roles/' + roleName + '/resources/' + resourceName + '/permissions/' + permission, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    role[resourceName] = data;
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, DEL /api/roles/' + roleName + '/resources/' + resourceName + '/permissions/' + permission + '\n', data);
                });
            };

            $scope.isAdminRole = function (rolName) {
                return rolName.toLowerCase() === 'admin';
            };
        }])

    .controller('ProfileCtrl', ['$scope', '$http', '$localStorage',
        function ($scope, $http, $localStorage) {
            $scope.$storage = $localStorage;

            var refresh = function () {
                $http.get('/api/users/' + $scope.uId, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.user = data;
                    $http.get('/api/users/' + data._id + '/roles', {
                        headers: {
                            'Authorization': 'Bearer ' + $scope.$storage.user.token
                        }
                    }).success(function (data) {
                        $scope.user.roles = {};
                        data.forEach(function (role) {

                            $scope.user.roles[role] = {
                                name: role
                            };
                            $http.get('/api/roles/' + role, {
                                headers: {
                                    'Authorization': 'Bearer ' + $scope.$storage.user.token
                                }
                            }).success(function (data) {
                                $scope.user.roles[role].info = data;
                            }).error(function (data, status) {
                                console.error('Status:', status, ', Error on ProfileCtrl, GET /api/roles/' + role + '\n', data);
                            });
                        });
                    }).error(function (data, status) {
                        console.error('Status:', status, ', Error on ProfileCtrl, GET /api/users/' + data._id + '/roles \n', data);

                    });
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ProfileCtrl, GET /api/users/' + $scope.uId + '\n', data);
                });

                $http.get('/api/roles', {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.appRoles = data;
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ProfileCtrl, GET /api/roles \n', data);
                });
            };

            refresh();

            $scope.isAdmin = function () {
                return $scope.$storage && $scope.$storage.user &&
                    $scope.$storage.user.roles && $scope.$storage.user.roles.indexOf('admin') !== -1;
            };

            $scope.changeName = function () {
                $http.put('/api/users/' + $scope.uId, $scope.newName, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    $scope.newName = undefined;
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ProfileCtrl, PUT /api/users/' + $scope.uId + '\n', data);
                });
            };

            $scope.changeEmail = function () {
                $http.put('/api/users/' + $scope.uId, $scope.newEmail, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    $scope.newEmail = undefined;
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ProfileCtrl, PUT /api/users/' + $scope.uId + '\n', data);
                });
            };

            $scope.addRole = function (role) {
                $http.post('/api/users/' + $scope.uId + '/roles', [role], {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ProfileCtrl, POST /api/users/' + $scope.uId + '/roles \n', data);
                });
            };

            $scope.removeRole = function (role) {
                $http.delete('/api/users/' + $scope.uId + '/roles/' + role, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ProfileCtrl, DEL /api/users/' + $scope.uId + '/roles \n', data);
                });
            };
        }]);