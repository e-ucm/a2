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

/* Controllers */
angular.module('myAppControllers', ['ngStorage', 'ngFileUpload', 'applicationsExample'])
    .factory('httpRequestInterceptor', [
        function () {
            return {
                request: function (config) {
                    config.headers.Accept = 'application/json';
                    return config;
                }
            };
        }
    ]).config(['$httpProvider',
        function ($httpProvider) {
            $httpProvider.interceptors.push('httpRequestInterceptor');
        }
    ]).directive('fileReader', function () {
    return {
        scope: {
            fileReader: '='
        },
        link: function (scope, element) {
            $(element).on('change', function (changeEvent) {
                var files = changeEvent.target.files;
                if (files.length) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var contents = e.target.result;
                        scope.$apply(function () {
                            scope.fileReader = {
                                contents: contents,
                                name: files[0].name
                            };
                        });
                    };

                    reader.readAsText(files[0]);
                }
            });
        }
    };
    /*
     * TOOLBAR CONTROLLER
     */
}).controller('ToolbarCtrl', ['$scope', '$http', '$window', '$timeout', '$localStorage',
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
                    Authorization: 'Bearer ' + $scope.$storage.user.token
                }
            }).success(function () {
                delete $scope.$storage.user;
                $timeout(function () {
                    $scope.href('/login');
                }, 110);
            }).error(function (data, status) {
                delete $scope.$storage.user;
                console.error('Status:', status, ', Error on ToolbarCtrl, GET /api/logout \n', data);
            });
        };

    }])
/*
 * LOGIN CONTROLLER
 */
    .controller('LoginCtrl', ['$scope', '$http', '$window', '$location', '$timeout', '$localStorage',
        function ($scope, $http, $window, $location, $timeout, $localStorage) {
            $scope.$storage = $localStorage;

            $scope.login = function () {
                $http.post('/api/login', $scope.user).success(function (data) {
                    $localStorage.$reset();
                    $scope.$storage.user = data.user;

                    $http.get('/api/users/' + data.user._id + '/roles', {
                        headers: {
                            Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        $scope.errorResponse = data.message;
                    });
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on LoginCtrl, POST /api/login \n', data);
                    $scope.errorResponse = data.message;
                });
            };

            $scope.beaconing = null;
            $http.get('/api/loginplugins').success(function (results) {
                for (var i = 0; i < results.data.length; ++i) {
                    if (results.data[i].pluginId === 'beaconing') {
                        $scope.beaconing = results.data[i];
                    }
                }
            });

            $scope.loginBeaconing = function () {
                var location = '/api/login/beaconing?callback=' + encodeURIComponent(
                    $window.location.origin + $window.location.pathname + 'byplugin');

                $window.location.href = location;
            };

            $scope.hasBeaconing = function () {
                return $scope.beaconing ? true : false;
            };
        }])
    /*
     * LOGIN PLUGINS CONTROLLER
     */
    .controller('LoginPluginCtrl', ['$scope', '$http', '$window', '$timeout', '$localStorage',
        function ($scope, $http, $window, $timeout, $localStorage) {
            $scope.$storage = $localStorage;
            $scope.setupUser = function (user) {
                if (user && user.username && user.email && user.token) {
                    $scope.$storage.user = user;

                    if (!$scope.$storage.user._id) {
                        $scope.$storage.user._id = $scope.$storage.user.id;
                    }

                    var wait = function (time) {
                        $timeout(function () {
                            $window.location.href = '/';
                        }, time);
                    };

                    if (user.redirect) {
                        $http.get('/api/lti/key/' + user.redirect).success(function (data) {
                            wait(110);
                        });
                    } else {
                        wait(110);
                    }
                } else {
                    $window.location.href = 'login';
                }
            };
        }])
    /*
     * SIGN UP CONTROLLER
     */
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
    /*
     * FORGOT PASSWORD CONTROLLER
     */
    .controller('ForgotCtrl', ['$scope', '$http', '$window',
        function ($scope, $http, $window) {
            $scope.successMsg = '';
            $scope.errorMsg = '';
            $scope.sendMail = function () {
                $http.post('/api/login/forgot/', {email: $scope.email})
                    .success(function () {
                        $scope.errorMsg = '';
                        $scope.successMsg = 'Please, check your mail. ' +
                            'We have sent you a email with which you can change your password';
                    }).error(function (data, status) {
                    $scope.errorMsg = data.message;
                    $scope.successMsg = '';
                    console.error('Status:', status, ', Error on ForgotCtrl, POST /api/login/forgot/' + '\n', data);
                });
            };
        }])
    /*
     * RESET PASSWORD CONTROLLER
     */
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
    /*
     * CONTACT CONTROLLER
     */
    .controller('ContactCtrl', ['$scope', '$http', '$window',
        function ($scope, $http, $window) {
            $scope.successMsg = '';
            $scope.errorMsg = '';
            $scope.contactObj = {
                name: '',
                email: '',
                text: ''
            };
            $scope.contact = function () {
                $http.post('/api/contact', $scope.contactObj)
                    .success(function () {
                        $scope.errorMsg = '';
                        $scope.successMsg = 'Email sent. We\'ll read it as soon as possible.';
                        $scope.contactObj = {
                            name: '',
                            email: '',
                            text: ''
                        };
                    }).error(function (data, status) {
                    $scope.errorMsg = data.message;
                    $scope.successMsg = '';
                    console.error('Status:', status, ', Error on ContactCtrl, POST /api/contact/' + '\n', data);
                });
            };
        }])
    /*
     * USERS CONTROLLER
     */
    .controller('UsersCtrl', ['$scope', '$http', '$window', '$localStorage',
        function ($scope, $http, $window, $localStorage) {
            $scope.$storage = $localStorage;

            /*
                Return the users by pages
             */
            var pages;
            var lastPage;
            var getUsers = function (page) {
                lastPage = page;
                $http.get('/api/users?page=' + page, {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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

            /*
                Function to upload a group of users by upload CSV file
            */
            $scope.addedFileError = [];
            $scope.addedFileMsn = '';
            $scope.uploadCSV = function () {
                if ($scope.csvFile) {
                    var formData = new FormData();
                    formData.append('csv', $scope.csvFile);
                    $http.post('/api/signup/massive', formData, {
                        headers: {
                            'Content-Type': undefined,
                            enctype: 'multipart/form-data',
                            Authorization: 'Bearer ' + $scope.$storage.user.token
                        }
                    }).success(function (data) {
                        $scope.addedFileMsn = data.msn;
                        if (data.errorCount > 0) {
                            $scope.addedFileError = data.errors;
                        } else {
                            $scope.addedFileError = [];
                        }
                        getUsers(lastPage);
                    }).error(function (data, status) {
                        console.error('Error on post /api/signup/massive' + JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };
        }])
    /*
     * APPLICATIONS CONTROLLER
     */
    .controller('ApplicationsCtrl', ['$scope', '$http', '$window', '$localStorage', 'applicationsExample',
        function ($scope, $http, $window, $localStorage, applicationsExample) {
            $scope.$storage = $localStorage;
            $scope.proxyRoute = $window.location.host + '/api/proxy/';

            /*
                Load de application list in the $scope.response var
             */
            var refresh = function () {
                $http.get('/api/applications', {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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

            /*
                If the last resource and permission in the received object are not empty, add a empty new one.
             */
            $scope.addResourceInput = function (applicationRole) {
                if (applicationRole.allows[applicationRole.allows.length - 1].resourceName !== '') {
                    applicationRole.allows.push({resourceName: '', permissionName: ''});
                }
            };

            /*
                If the last object in anonymousRoutes array is not empty, add new object to the array with
                an empty route to fill it
             */
            $scope.addAnonymousRouteInput = function () {
                if ($scope.anonymousRoutes[$scope.anonymousRoutes.length - 1].route !== '') {
                    $scope.anonymousRoutes.push({route: ''});
                }
            };

            /*
                If the last object resource in applicationRoles array is not empty, add new object to the array
             */
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

            /*
                Modify application config (name, host, routes...)
             */
            $scope.applyChanges = function (application) {
                var returnApp =  {
                    prefix: application.prefix,
                        host: application.host,
                    name: application.name
                };

                if(application.anonymousRoute) {
                    returnApp.anonymous = [application.anonymousRoute];
                }
                $http.put('/api/applications/' + application._id, returnApp, {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ApplicationsCtrl, PUT /api/applications/' + application._id + '\n', data);
                });
            };

            /*
                Add new application with not empty routes, resources and permissions.
             */
            $scope.addApplication = function () {
                var applicationData = {
                    name: $scope.name,
                    prefix: $scope.prefix,
                    host: $scope.host
                };

                // Check and discard empty data
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

                // Add the application
                $http.post('/api/applications/', applicationData, {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    // Clean form
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

            /*
                Remove the application with the id "appId"
             */
            $scope.deleteApplication = function (appId) {
                $http.delete('/api/applications/' + appId, {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    // Updated the application list to show it
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ApplicationsCtrl, DEL /api/applications/' + appId + '\n', data);
                });
            };

            $scope.emotionsApplication = applicationsExample.emotionsApplication;
            $scope.gleanerApplication = applicationsExample.gleanerApplication;
            $scope.applicationString = JSON.stringify($scope.gleanerApplication, null, 4);
            /*
                Add the application that are inside the var "applicationString".
                "applicationString" can be modified in the view (text-area.jade)
             */
            $scope.addScriptApplication = function () {
                var data = JSON.parse($scope.applicationString);
                $http.post('/api/applications', data, {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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
    /*
     * ROLES CONTROLLER
     */
    .controller('RolesCtrl', ['$scope', '$http', '$location', '$localStorage',
        function ($scope, $http, $location, $localStorage) {
            $scope.$storage = $localStorage;
            $scope.newPer = {};
            $scope.newRec = {};
            $scope.newRecPer = {};

            /*
                Get the roles list to show it into a view
             */
            var getRoles = function () {
                $http.get('/api/roles', {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.rolesList = {};
                    data.forEach(function (role) {
                        $scope.rolesList[role] = {
                            name: role
                        };
                        $http.get('/api/roles/' + role, {
                            headers: {
                                Authorization: 'Bearer ' + $scope.$storage.user.token
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

            getRoles();

            $scope.newRoleModel = [{resourceName: '', permissionName: ['']}];

            /*
                Create new input to add new resources into a role
             */
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    var role = $scope.rolesList[roleName].info;
                    role[resourceName] = role[resourceName].concat($scope.newPer[resourceName].split(' '));
                    $scope.newPer[resourceName] = '';
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, POST /api/roles/' +
                        roleName + '/resources/' + resourceName + '/permissions \n', data);
                });
            };

            $scope.removeRole = function (roleName) {
                $http.delete('/api/roles/' + roleName, {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    role[resourceName] = data;
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on RolesCtrl, DEL /api/roles/' +
                        roleName + '/resources/' + resourceName + '/permissions/' + permission + '\n', data);
                });
            };

            $scope.isAdminRole = function (rolName) {
                return rolName.toLowerCase() === 'admin';
            };
        }])
    /*
     * PROFILE CONTROLLER
     */
    .controller('ProfileCtrl', ['$scope', '$http', '$localStorage',
        function ($scope, $http, $localStorage) {
            $scope.$storage = $localStorage;

            // Load user account info and roles
            var refresh = function () {
                $http.get('/api/users/' + $scope.uId, {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function (data) {
                    $scope.user = data;
                    $http.get('/api/users/' + data._id + '/roles', {
                        headers: {
                            Authorization: 'Bearer ' + $scope.$storage.user.token
                        }
                    }).success(function (data) {
                        $scope.user.roles = {};
                        data.forEach(function (role) {

                            $scope.user.roles[role] = {
                                name: role
                            };
                            $http.get('/api/roles/' + role, {
                                headers: {
                                    Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    $scope.newEmail = undefined;
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ProfileCtrl, PUT /api/users/' + $scope.uId + '\n', data);
                });
            };

            $scope.changePassword = function () {
                if ($scope.pass.new !== $scope.pass.repeat) {
                    $scope.pass.success = undefined;
                    $scope.pass.errorIncorrect = undefined;
                    $scope.pass.notEqual = 'The password are different';
                    return;
                }
                var passwordObj = {
                    password: $scope.pass.old,
                    newPassword: $scope.pass.new
                };
                $http.put('/api/users/' + $scope.uId + '/password', passwordObj, {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    $scope.pass.success = 'The password has changed successfully';
                    $scope.pass.errorIncorrect = undefined;
                    $scope.pass.notEqual = undefined;
                    resetPasswordForm();
                }).error(function (data, status) {
                    if (status === 401) {
                        $scope.pass.errorIncorrect = 'Incorrect password';
                    } else {
                        $scope.pass.errorIncorrect = 'The password didn\'t change';
                    }
                    $scope.pass.success = undefined;
                    $scope.pass.notEqual = undefined;
                    resetPasswordForm();
                    console.error('Status:', status, ', Error on ProfileCtrl, PUT /api/users/' + $scope.uId + '\n', data);
                });
            };

            // Clear view passwords fields
            var resetPasswordForm = function () {
                $scope.pass.old = '';
                $scope.pass.new = '';
                $scope.pass.repeat = '';
            };

            $scope.addRole = function (role) {
                $http.post('/api/users/' + $scope.uId + '/roles', [role], {
                    headers: {
                        Authorization: 'Bearer ' + $scope.$storage.user.token
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
                        Authorization: 'Bearer ' + $scope.$storage.user.token
                    }
                }).success(function () {
                    refresh();
                }).error(function (data, status) {
                    console.error('Status:', status, ', Error on ProfileCtrl, DEL /api/users/' + $scope.uId + '/roles \n', data);
                });
            };
        }]);