'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngStorage'])

    .controller('ToolbarController', ['$scope', '$http', '$window', '$timeout', '$localStorage',
        function ToolbarController($scope, $http, $window, $timeout, $localStorage) {
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
                    console.error('Error on get /api/logout ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

        }])

    .controller('LoginController', ['$scope', '$http', '$window', '$timeout', '$localStorage',
        function LoginController($scope, $http, $window, $timeout, $localStorage) {
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
                        console.error('Error on get /api/users/:userId/roles: ' + JSON.stringify(data) + ', status: ' + status);

                    });
                }).error(function (data, status) {
                    console.error('Error on post /api/login: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };
        }])

    .controller('ResetController', ['$scope', '$http', '$window',
        function ResetController($scope, $http, $window) {

            $scope.resetPassword = function () {
                $http.post('/api/login/reset/' + $scope.tkn, $scope.password, {})
                    .success(function () {
                        $window.location.href = '/login';
                    }).error(function (data, status) {
                        console.error('Error on post /api/reset/:token: ' + JSON.stringify(data) + ', status: ' + status);
                    });
            };
        }])

    .controller('UsersController', ['$scope', '$http', '$window', '$localStorage',
        function UsersController($scope, $http, $window, $localStorage) {
            $scope.$storage = $localStorage;

            $http.get('/api/users', {
                headers: {
                    'Authorization': 'Bearer ' + $scope.$storage.user.token
                }
            }).success(function (data) {
                $scope.response = data;
            }).error(function (data, status) {
                console.error('Error on get /api/users: ' + JSON.stringify(data) + ', status: ' + status);
            });

            $scope.edit = function (userId) {
                $window.location.href = '/users/' + userId;
            };
        }])

    .controller('ApplicationsController', ['$scope', '$http', '$window', '$localStorage',
        function ApplicationsController($scope, $http, $window, $localStorage) {
            $scope.$storage = $localStorage;

            var refresh = function () {

                $http.get('/api/applications', {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.response = data;
                }).error(function (data, status) {
                    console.error('Error on get /api/applications: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            refresh();

            $scope.changeName = function (appId, appName) {

                $http.put('/api/applications/' + appId, {
                    name: appName
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Error on put /api/applications/:appId: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.addApplication = function () {

                $http.post('/api/applications/', {
                    prefix: $scope.prefix,
                    host: $scope.host
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    var name = $scope.name;
                    if (name) {
                        console.log(data);
                        $scope.changeName(data._id, name);
                    } else {
                        refresh();
                    }
                    $scope.name = '';
                    $scope.prefix = '';
                    $scope.host = '';
                }).error(function (data, status) {
                    console.error('Error on post /api/applications/:appId: ' + JSON.stringify(data) + ', status: ' + status);
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
                    console.error('Error on get /api/applications/:appId: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };
        }])

    .controller('RolesController', ['$scope', '$http', '$location', '$localStorage',
        function RolesController($scope, $http, $location, $localStorage) {
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
                            console.error('Error on get /api/roles/:roleName: ' + JSON.stringify(data) + ', status: ' + status);
                        });
                    });
                }).error(function (data, status) {
                    console.error('Error on get /api/roles ' + JSON.stringify(data) + ', status: ' + status);

                });
            };

            getRoles();

            $scope.addRole = function (roleName) {
                $scope.item = {
                    roles: $scope.newRole.name,
                    resources: [$scope.newRole.resource],
                    permissions: [$scope.newRole.permission]
                };

                $http.post('/api/roles/', $scope.item, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    var role = $scope.rolesList[$scope.newRole.name] = {};
                    role.name = $scope.newRole.name;
                    role.info = {};
                    role.info[$scope.newRole.resource] = [$scope.newRole.permission];
                    $scope.newRole.name = '';
                    $scope.newRole.resource = '';
                    $scope.newRole.permission = '';
                }).error(function (data, status) {
                    console.error('Error on get /api/roles/' + roleName + ' ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.addResource = function (roleName) {
                $scope.item = {resources: [], permissions: []};
                $scope.item.resources.push($scope.newRec[roleName]);
                $scope.item.permissions.push($scope.newRecPer[roleName]);

                $http.post('/api/roles/' + roleName + '/resources', $scope.item, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    var role = $scope.rolesList[roleName] || {};
                    if (!role.info) {
                        role.info = {};
                    }
                    role.info[$scope.newRec[roleName]] = [$scope.newRecPer[roleName]];
                    $scope.newRec[roleName] = '';
                    $scope.newRecPer[roleName] = '';
                }).error(function (data, status) {
                    console.error('Error on get /api/roles/' + roleName + '/resources ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.addPermission = function (roleName, resourceName) {
                $scope.item = {permissions: []};
                $scope.item.permissions.push($scope.newPer[resourceName]);
                $http.post('/api/roles/' + roleName + '/resources/' + resourceName + '/permissions', $scope.item, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    var role = $scope.rolesList[roleName].info;
                    role[resourceName].push($scope.newPer[resourceName]);
                    $scope.newPer[resourceName] = '';
                }).error(function (data, status) {
                    console.error('Error on post /api/roles/' + roleName + '/resources/' + resourceName + '/permissions/ ' + JSON.stringify(data) + ', status: ' + status);
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
                    console.error('Error on post /api/roles/' + roleName + JSON.stringify(data) + ', status: ' + status);
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
                    console.error('Error delete get /api/roles/' + roleName + '/resources/' + resourceName + ' ' + JSON.stringify(data) + ', status: ' + status);
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
                    console.error('Error on delete /api/roles/' + roleName + '/resources/' + resourceName + '/permissions/' + permission + ' ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.isAdminRole = function (rolName) {
                return rolName.toLowerCase() === 'admin';
            };
        }])

    .controller('ProfileController', ['$scope', '$http', '$localStorage',
        function ProfileController($scope, $http, $localStorage) {
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
                                console.error('Error on get /api/roles/:roleName: ' + JSON.stringify(data) + ', status: ' + status);
                            });
                        });
                    }).error(function (data, status) {
                        console.error('Error on get /api/users/:userId/roles: ' + JSON.stringify(data) + ', status: ' + status);

                    });
                }).error(function (data, status) {
                    console.error('Error on get /api/users/:userId: ' + JSON.stringify(data) + ', status: ' + status);
                });

                $http.get('/api/roles', {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.appRoles = data;
                }).error(function (data, status) {
                    console.error('Error on get /api/roles: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            refresh();

            $scope.isAdmin = function () {
                return $scope.$storage && $scope.$storage.user &&
                    $scope.$storage.user.roles && $scope.$storage.user.roles.indexOf('admin') !== -1;
            };

            $scope.changeName = function () {
                $http.put('/api/users/' + $scope.uId, $scope.name, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Error on post /api/users/:userId: ' + JSON.stringify(data) + ', status: ' + status);
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
                    console.error('Error on post /api/users/:userId/roles: ' + JSON.stringify(data) + ', status: ' + status);
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
                    console.error('Error on post /api/users/:userId/roles: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };
        }]);