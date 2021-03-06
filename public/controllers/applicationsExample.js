'use strict';

var apps = angular.module('applicationsExample', []);

apps.constant('applicationsExample', {
    emotionsApplication: {
        name: 'emotions',
        prefix: 'emotions',
        host: 'http://localhost:3232/api',
        anonymous: [
            '/emotions'
        ]
    },
    gleanerApplication: {
        name: 'gleaner',
        prefix: 'gleaner',
        host: 'http://localhost:3300/api',
        roles: [
            {
                roles: 'student',
                allows: [
                    {
                        resources: [
                            '/games/public',
                            '/games/:gameId/versions',
                            '/games/:gameId/versions/:versionId',
                            '/games/:gameId/versions/:versionId/sessions/my',
                            '/sessions/:sessionId/results'
                        ],
                        permissions: [
                            'get'
                        ]
                    },
                    {
                        resources: [
                            '/sessions/:sessionId'
                        ],
                        permissions: [
                            'put',
                            'get'
                        ]
                    }
                ]
            },
            {
                roles: 'teacher',
                allows: [
                    {
                        resources: [
                            '/games/public',
                            '/games/:gameId/versions',
                            '/games/:gameId/versions/:versionId',
                            '/games/:gameId/versions/:versionId/sessions/my',
                            '/sessions/:sessionId/results'

                        ],
                        permissions: [
                            'get'
                        ]
                    },
                    {
                        resources: [
                            '/sessions/:sessionId',
                            '/sessions/:sessionId/remove',
                            '/sessions/:sessionId/results/:resultsId'
                        ],
                        permissions: [
                            '*'
                        ]
                    },
                    {
                        resources: [
                            '/games/:gameId/versions/:versionId/sessions',
                            '/sessions/:sessionId/event/:event'
                        ],
                        permissions: [
                            'post'
                        ]
                    }
                ]
            },
            {
                roles: 'developer',
                allows: [
                    {
                        resources: [
                            '/games/my',
                            '/games/:gameId',
                            '/games/:gameId/versions',
                            '/games/:gameId/versions/:versionId'
                        ],
                        permissions: [
                            '*'
                        ]
                    },
                    {
                        resources: [
                            '/games/:gameId/versions/:versionId/sessions',
                            '/sessions/:sessionId'
                        ],
                        permissions: [
                            'get'
                        ]
                    },
                    {
                        resources: [
                            '/games'
                        ],
                        permissions: [
                            'post'
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
    }
});
