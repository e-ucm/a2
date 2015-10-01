'use strict';

var should = require('should');

var configValues;

describe('Config files  validations', function () {

    it('should return a correct config-values file', function (done) {
        configValues = require('../config-values.js');
        var keys = Object.keys(configValues);
        should(keys.length).equal(2);
        should(keys).containDeep(['defaultValues', 'testValues']);

        var defaultKeys = Object.keys(configValues.defaultValues);
        var testKeys = Object.keys(configValues.testValues);
        should(defaultKeys.length).equal(testKeys.length);
        should(defaultKeys).containDeep(testKeys);

        done();
    });

    it('should have generated correctly the config files', function (done) {
        var config = require('../config.js');
        var testConfig = require('../config-test.js');

        var configKeys = Object.keys(config);
        var testConfigKeys = Object.keys(testConfig);

        should(configKeys.length).equal(testConfigKeys.length);
        should(configKeys).containDeep(testConfigKeys);

        var toType = function(obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        };

        configKeys.forEach(function(configKey) {
            should(toType(configKeys[configKey])).equal(toType(testConfigKeys[configKey]));
        });

        var defaultKeys = Object.keys(configValues.defaultValues);
        var testKeys = Object.keys(configValues.testValues);
        should(defaultKeys.length).equal(testKeys.length);
        should(defaultKeys).containDeep(testKeys);

        done();
    });
});