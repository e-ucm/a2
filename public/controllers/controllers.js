'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngStorage'])

    .controller('LoginController', ['$scope', '$http', '$location', '$localStorage',
        function LoginController($scope, $http, $location, $localStorage) {
            $scope.$storage = $localStorage;

            $scope.login = function () {

                $http.post('/api/login', {
                    username: $scope.password,
                    password: $scope.username
                }).success(function (data, status) {
                    $scope.$storage.user = data.user;


                    $http.get('/api/users/' + data.user.id + '/roles', {
                        headers: {
                            'Authorization': 'Bearer ' + $scope.$storage.user.token
                        }
                    }).success(function (data) {
                        $scope.$storage.user.roles = data;

                        if (data.indexOf('admin') === -1) {
                            $location.path('/users/' + $scope.$storage.user.id);
                        } else {
                            $location.path('/users');
                        }
                    }).error(function (data, status) {
                        console.error('Error on get /api/users/:userId/roles: ' + JSON.stringify(data) + ', status: ' + status);

                    });
                }).error(function (data, status) {
                    console.error('Error on post /api/login: ' + JSON.stringify(data) + ', status: ' + status);
                });
            };
        }])

    .controller('UsersController', ['$scope', '$http', '$location', '$localStorage',
        function UsersController($scope, $http, $location, $localStorage) {
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
                $location.path('/users/' + userId);
            };
        }])

    .controller('ProfileController', ['$scope', '$http', '$location', '$localStorage',
        function UsersController($scope, $http, $location, $localStorage) {
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
                                console.log('successs: role: ' + role);
                                console.log(data);
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
                    .success(function (data, status) {
                        refresh();
                    }).error(function (data, status) {
                        console.error('Error on post /api/users/:userId: ' + JSON.stringify(data) + ', status: ' + status);
                    });
            };
        }]);