'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngStorage'])

    .controller('LoginController', ['$scope', '$http', '$window', '$timeout', '$localStorage',
        function LoginController($scope, $http, $window, $timeout, $localStorage) {
            $scope.$storage = $localStorage;

            $scope.login = function () {

                $http.post('/api/login', $scope.user).success(function (data, status) {
                    $localStorage.$reset();
                    $scope.$storage.user = data.user;

                    $http.get('/api/users/' + data.user.id + '/roles', {
                        headers: {
                            'Authorization': 'Bearer ' + $scope.$storage.user.token
                        }
                    }).success(function (data) {
                        $scope.$storage.user.roles = data;
                        // Timeout needed in order to ensure that the
                        // $localStorage changes are persisted, more info. at
                        // https://github.com/gsklee/ngStorage/issues/39
                        $timeout(function () {
                            $window.location.href = '/users/' + $scope.$storage.user.id;
                        }, 110);
                    }).error(function (data, status) {
                        console.error('Error on get /api/users/:userId/roles: ' + JSON.stringify(data) + ', status: ' + status);

                    });
                }).error(function (data, status) {
                    console.error('Error on post /api/login: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };
        }])

    .controller('ResetController', ['$scope', '$http', '$window', '$localStorage',
        function ResetController($scope, $http, $window, $localStorage) {

            $scope.resetPassword = function () {
                $http.post('/api/login/reset/' + $scope.tkn, $scope.password, {})
                    .success(function (data, status) {
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

            $scope.addResource = function (rolName) {
                $scope.item = {resources: [], permissions: []};
                $scope.item.resources.push($scope.newRec[rolName]);
                $scope.item.permissions.push($scope.newRecPer[rolName]);

                $http.post('/api/roles/' + rolName + '/resources', $scope.item, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    console.log('succes')
                }).error(function (data, status) {
                    console.error('Error on get /api/roles/' + roleName + ' ' + JSON.stringify(data) + ', status: ' + status);

                });
            };

            $scope.addPermission = function (roleName, resourceName) {
                $scope.item = {permissions: []};
                $scope.item.permissions.push($scope.newPer[resourceName]);
                $http.post('/api/roles/' + roleName + '/resources/' + resourceName + '/permissions', $scope.item, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    console.log('succes')
                }).error(function (data, status) {
                    console.error('Error on get /api/roles/' + roleName + ' ' + JSON.stringify(data) + ', status: ' + status);
                    window.document.write(data)
                });
            };

            $scope.removeResource = function (roleName, resourceName) {
                $http.delete('/api/roles/' + roleName + '/resources/' + resourceName, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    console.log('succes')
                }).error(function (data, status) {
                    console.error('Error on get /api/roles/' + roleName + ' ' + JSON.stringify(data) + ', status: ' + status);
                    window.document.write(data)
                });
            };

            $scope.removePermission = function (roleName, resourceName) {
                $http.delete('/api/roles/' + roleName + '/resources/' + resourceName + '/permissions/' + $scope.newPer[resourceName], {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    console.log('succes')
                }).error(function (data, status) {
                    console.error('Error on get /api/roles/' + roleName + ' ' + JSON.stringify(data) + ', status: ' + status);
                    window.document.write(data)
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
                }).success(function (data, status) {
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
            };

            refresh();

            $scope.isAdmin = function () {
                return $scope.$storage && $scope.$storage.user &&
                    $scope.$storage.user.roles && $scope.$storage.user.roles.indexOf('admin') != -1;
            };

            $scope.changeName = function () {
                $http.put('/api/users/' + $scope.uId, $scope.name, {
                    headers: {
                        'Authorization': 'Bearer ' + $scope.$storage.user.token
                    }
                }, $scope.name)
                    .success(function () {
                        refresh();
                    }).error(function (data, status) {
                        console.error('Error on post /api/users/:userId: ' + JSON.stringify(data) + ', status: ' + status);
                    });
            };
        }]);