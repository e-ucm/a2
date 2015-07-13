'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
    'myApp.controllers'
])
    .config(function ($locationProvider) {
        $locationProvider.html5Mode(true);
    });