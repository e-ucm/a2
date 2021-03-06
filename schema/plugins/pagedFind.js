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

var Async = require('async');

module.exports = exports = function pagedFindPlugin(schema) {
    schema.statics.pagedFind = function (filter, fields, removeFields, sort, limit, page, callback) {

        var output = {
            data: undefined,
            pages: {
                current: page,
                prev: 0,
                hasPrev: false,
                next: 0,
                hasNext: false,
                total: 0
            },
            items: {
                limit: limit,
                begin: ((page * limit) - limit) + 1,
                end: page * limit,
                total: 0
            }
        };


        var fieldsAdapter = function (fields) {

            if (Object.prototype.toString.call(fields) === '[object String]') {
                var document = {};

                fields = fields.split(/\s+/);
                fields.forEach(function (field) {

                    if (field) {
                        document[field] = true;
                    }
                });

                fields = document;
            }

            return fields;
        };

        var sortAdapter = function (sorts) {

            if (Object.prototype.toString.call(sorts) === '[object String]') {
                var document = {};

                sorts = sorts.split(/\s+/);
                sorts.forEach(function (sort) {

                    if (sort) {
                        var order = sort[0] === '-' ? -1 : 1;
                        if (order === -1) {
                            sort = sort.slice(1);
                        }
                        document[sort] = order;
                    }
                });

                sorts = document;
            }

            return sorts;
        };

        fields = fieldsAdapter(fields);
        if (removeFields) {
            removeFields.forEach(function (field) {
                fields[field] = false;
            });
        }
        sort = sortAdapter(sort);

        var self = this;

        Async.auto({
            count: function (done) {

                self.count(filter, done);
            },
            find: function (done) {

                var options = {
                    limit: limit,
                    skip: (page - 1) * limit,
                    sort: sort
                };

                self.find(filter, fields, options).exec(done);
            }
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            output.data = results.find;
            output.items.total = results.count;

            // Paging calculations
            output.pages.total = Math.ceil(output.items.total / limit);
            output.pages.next = output.pages.current + 1;
            output.pages.hasNext = output.pages.next <= output.pages.total;
            output.pages.prev = output.pages.current - 1;
            output.pages.hasPrev = output.pages.prev !== 0;
            if (output.items.begin > output.items.total) {
                output.items.begin = output.items.total;
            }
            if (output.items.end > output.items.total) {
                output.items.end = output.items.total;
            }

            callback(null, output);
        });
    };
};
