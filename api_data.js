define({ "api": [
  {
    "type": "delete",
    "url": "/applications/:applicationId",
    "title": "Removes the application.",
    "name": "DeleteApplication",
    "group": "Applications",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "applicationId",
            "description": "<p>ApplicationId id.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "ApplicationNotFound",
            "description": "<p>No application with the given application id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/applications.js",
    "groupTitle": "Applications"
  },
  {
    "type": "get",
    "url": "/applications/:applicationId",
    "title": "Gets the application information.",
    "name": "GetApplication",
    "group": "Applications",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "applicationId",
            "description": "<p>Application id.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"name\": \"My App Name\",\n    \"prefix\": \"gleaner\",\n    \"host\": \"localhost:3300\",\n    \"anonymous\": [],\n    \"timeCreated\": \"2015-07-06T09:03:52.636Z\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "ApplicationNotFound",
            "description": "<p>No application with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/applications.js",
    "groupTitle": "Applications"
  },
  {
    "type": "get",
    "url": "/applications/prefix/:prefix",
    "title": "Gets the application information.",
    "name": "GetApplication",
    "group": "Applications",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "applicationId",
            "description": "<p>Application id.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"name\": \"My App Name\",\n    \"prefix\": \"gleaner\",\n    \"host\": \"localhost:3300\",\n    \"anonymous\": [],\n    \"timeCreated\": \"2015-07-06T09:03:52.636Z\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "ApplicationNotFound",
            "description": "<p>No application with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/applications.js",
    "groupTitle": "Applications"
  },
  {
    "type": "get",
    "url": "/applications",
    "title": "Returns all the registered applications.",
    "name": "GetApplications",
    "group": "Applications",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "fields",
            "description": "<p>The fields to be populated in the resulting objects. An empty string will return the complete document.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "sort",
            "defaultValue": "_id",
            "description": "<p>Place - before the field for a descending sort.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "defaultValue": "20",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "page",
            "defaultValue": "1",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"fields\": \"_id name prefix host anonymous timeCreated\",\n    \"sort\": \"-name\",\n    \"limit\": 20,\n    \"page\": 1\n}",
          "type": "json"
        },
        {
          "title": "Request-Example:",
          "content": "{\n    \"fields\": \"\",\n    \"sort\": \"name\",\n    \"limit\": 20,\n    \"page\": 1\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"data\": [\n    {\n        \"_id\": \"559a447831b7acec185bf513\",\n        \"name\": \"Gleaner App.\",\n        \"prefix\": \"gleaner\",\n        \"host\": \"localhost:3300\",\n        \"owner\": \"root\",\n        \"autoroles\": [\n            \"student\",\n            \"teacher,\n            \"developer\"\n        ],\n        \"timeCreated\": \"2015-07-06T09:03:52.636Z\",\n        \"routes\": [\n            \"gleaner/games\",\n            \"gleaner/activities\",\n            \"gleaner/classes\"\n         ],\n         \"anonymous\": [\n            \"/collector\",\n            \"/env\"\n         ],\n         \"look\":[\n            {\n                \"url\": \"route/get\",\n                \"permissions: {\n                    \"user1: [\n                        \"dashboard1\",\n                        \"dashboard2\"\n                    ],\n                    \"user2: [\n                        \"dashboard1\",\n                        \"dashboard3\"\n                    ]\n                }\n            }\n         ]\n    }],\n    \"pages\": {\n        \"current\": 1,\n        \"prev\": 0,\n        \"hasPrev\": false,\n        \"next\": 2,\n        \"hasNext\": false,\n        \"total\": 1\n   },\n    \"items\": {\n        \"limit\": 20,\n        \"begin\": 1,\n        \"end\": 1,\n        \"total\": 1\n    }\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/applications.js",
    "groupTitle": "Applications"
  },
  {
    "type": "post",
    "url": "/applications",
    "title": "Register a new application, if an application with the same prefix already exists it will be overridden with the new values.",
    "name": "PostApplications",
    "group": "Applications",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "prefix",
            "description": "<p>Application prefix.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "host",
            "description": "<p>Application host.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "anonymous",
            "description": "<p>Express-like] routes for whom unidentified (anonymous) requests will be forwarded anyway.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "autoroles",
            "description": "<p>Roles that the application use.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": true,
            "field": "look",
            "description": "<p>Allow access to routes for specific users. Key field identify specific field that the algorithm need look to allow the access. In the next example, the user1 can use the route POST &quot;rout/get&quot; to see results if the req.body contains the value &quot;dashboard1&quot; in &quot;docs._id&quot; field. &quot;look&quot;:[{&quot;url&quot;: &quot;route/get&quot;, &quot;permissions: { &quot;user1: [&quot;dashboard1&quot;] }, &quot;key&quot;: &quot;docs._id&quot;, &quot;_id&quot;: &quot;59ce615e3ef2df4d94f734fc&quot;, &quot;methods&quot;: [&quot;post&quot;]}]</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "routes",
            "description": "<p>All the applications routes that are not anonymous</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "owner",
            "description": "<p>The (user) owner of the application</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"name\": \"Gleaner\",\n    \"prefix\" : \"gleaner\",\n    \"host\" : \"localhost:3300\",\n    \"autoroles\": [\n        \"student\",\n        \"teacher,\n        \"developer\"\n    ],\n    \"look\":[\n        {\n            \"url\": \"route/get\",\n            \"permissions: {\n                \"user1: [\n                    \"dashboard1\",\n                    \"dashboard2\"\n                 ],\n                 \"user2: [\n                    \"dashboard1\",\n                    \"dashboard3\"\n                 ]\n            },\n            \"key\": \"docs._id\",\n            \"_id\": \"59ce615e3ef2df4d94f734fc\",\n            \"methods\": [\n                \"post\",\n                \"put\"\n            ]\n         }\n    ]\n    \"anonymous\": [\n        \"/collector\",\n        \"/env\"\n    ],\n    \"routes\": [\n        \"gleaner/games\",\n        \"gleaner/activities\",\n        \"gleaner/classes\"\n    ],\n    \"owner\": \"root\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"prefix\": \"gleaner\",\n    \"host\": \"localhost:3300\",\n    \"anonymous\": [\n        \"/collector\",\n        \"/env\"\n     ],\n    \"timeCreated\": \"2015-07-06T09:03:52.636Z\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "PrefixRequired",
            "description": "<p>Prefix required!.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "HostRequired",
            "description": "<p>Host required!.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/applications.js",
    "groupTitle": "Applications"
  },
  {
    "type": "put",
    "url": "/applications/:applicationId",
    "title": "Changes the application values.",
    "name": "PutApplication",
    "group": "Applications",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "applicationId",
            "description": "<p>ApplicationId id.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>The new name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "prefix",
            "description": "<p>Application prefix.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "host",
            "description": "<p>Application host.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "anonymous",
            "description": "<p>Express-like routes for whom unidentified (anonymous) requests will be forwarded anyway. The routes from this array will be added only if they're not present yet.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": true,
            "field": "look",
            "description": "<p>Allow access to routes for specific users.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "routes",
            "description": "<p>All the applications routes that are not anonymous</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"name\": \"Gleaner App.\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"name\": \"Gleaner App.\",\n    \"prefix\": \"gleaner\",\n    \"host\": \"localhost:3300\",\n    \"anonymous\": [],\n    \"timeCreated\": \"2015-07-06T09:03:52.636Z\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "InvalidApplicationId",
            "description": "<p>You must provide a valid application id.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "ApplicationNotFound",
            "description": "<p>No application with the given application id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/applications.js",
    "groupTitle": "Applications"
  },
  {
    "type": "put",
    "url": "/applications/look/:prefix",
    "title": "Changes the application look field.",
    "name": "PutApplicationLook",
    "group": "Applications",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "prefix",
            "description": "<p>Application prefix.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "key",
            "description": "<p>Field name to check in the body of the request.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>The user that have access to the URL.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "resources",
            "description": "<p>The value of the key field that can use the user in the URL route.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "methods",
            "description": "<p>URL methods allowed.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "url",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example (Single-User):",
          "content": "{\n    \"key\": \"_id\",\n    \"user\": \"dev\",\n    \"resources\": [\"id1\"],\n    \"methods\": [\"post\", \"put\"],\n    \"url\": \"/url/*\"\n}",
          "type": "json"
        },
        {
          "title": "Request-Example (Multiple-User):",
          "content": "{\n    \"key\": \"_id\",\n    \"users\": [\"u1\", \"u2\", \"u3\"],\n    \"resources\": [\"id1\"],\n    \"methods\": [\"post\", \"put\"],\n    \"url\": \"/url/*\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"name\": \"Gleaner App.\",\n    \"prefix\": \"gleaner\",\n    \"host\": \"localhost:3300\",\n    \"anonymous\": [],\n    \"look\":[{\n        \"key\":\"_id\",\n        \"permissions\":{\n           \"dev\":[\"id1\",\"id2\"]\n         },\n        \"methods\":[\"post\",\"put\"],\n        \"url\":\"/url/*\"\n    }],\n    \"timeCreated\": \"2015-07-06T09:03:52.636Z\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "InvalidApplicationId",
            "description": "<p>You must provide a valid application name.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "ApplicationNotFound",
            "description": "<p>No application with the given application id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/applications.js",
    "groupTitle": "Applications"
  },
  {
    "type": "post",
    "url": "/contact",
    "title": "Send contact mail",
    "name": "Contact",
    "group": "Contact",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>User name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mail",
            "description": "<p>User mail.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "text",
            "description": "<p>Message.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"name\": \"Your Name\",\n    \"email\": \"your@email.com\",\n    \"text\": \"Your message here\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RequiredName",
            "description": "<p>Required the name field.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "RequiredEmail",
            "description": "<p>Required the email field.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "InvalidEmail",
            "description": "<p>Invalid email.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "RequiredText",
            "description": "<p>Required the text field.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/contact.js",
    "groupTitle": "Contact"
  },
  {
    "type": "get",
    "url": "/health",
    "title": "Check the api health.",
    "name": "Heath",
    "group": "Health",
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"status\": \"Available\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/health.js",
    "groupTitle": "Health"
  },
  {
    "type": "post",
    "url": "/login/forgot",
    "title": "Sends an email with a key to reset the password.",
    "name": "Forgot",
    "group": "Login",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>User email.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"email\": \"your@email.com\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "EmailDoesNotExist",
            "description": "<p>No account with that email address exists.</p>"
          }
        ],
        "403": [
          {
            "group": "403",
            "optional": false,
            "field": "EmailAlreadySent",
            "description": "<p>Other email to reset password was sent recently.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/login.js",
    "groupTitle": "Login"
  },
  {
    "type": "post",
    "url": "/login",
    "title": "LogIn the user.",
    "name": "Login",
    "group": "Login",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>User username.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>User password.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"username\": \"username\",\n    \"password\": \"pass\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"user\": {\n        \"_id\": \"559a447831b7acec185bf513\",\n        \"username\": \"root\",\n        \"email\": \"yourmail@ucm.es\",\n        \"roles\" : [\"admin\"],\n        \"token\": \"eyJ0eXAiOiJKV1QiLCJhbGciOiJIU...\"\n    }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>User not found.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/login.js",
    "groupTitle": "Login"
  },
  {
    "type": "get",
    "url": "/loginplugins",
    "title": "Returns all the registered login plugins.",
    "name": "GetLoginPlugins",
    "group": "LoginPlugins",
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"data\": [\n    {\n        \"name\": \"SAML Stichting Praktijkleren\",\n        \"pluginId\": \"samlnl\"\n    }]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/loginPlugins.js",
    "groupTitle": "LoginPlugins"
  },
  {
    "type": "post",
    "url": "/login/reset/:token",
    "title": "Sets a new password in the user with token.",
    "name": "Reset",
    "group": "Login",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>The new user password.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"password\": \"newPassword\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "InvalidToken",
            "description": "<p>Password reset token is invalid or has expired.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/login.js",
    "groupTitle": "Login"
  },
  {
    "type": "delete",
    "url": "/logout",
    "title": "LogOut the user.",
    "name": "Logout",
    "group": "Logout",
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/logout.js",
    "groupTitle": "Logout"
  },
  {
    "type": "post",
    "url": "/proxy/:prefix*",
    "title": "Proxy everything that goes after :prefix to the application registered with the given prefix.",
    "name": "Proxy",
    "group": "Proxy",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "prefix",
            "description": "<p>The unique prefix of a previously registered application.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "ANY_ROUTE",
            "description": "<p>Relevant for the API this request will be forwarded to. The target API will receive this route.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "\nAsuming we already have a registered application with the following data:\n\n    prefix: gleaner\n    host: localhost:3300\n    name: Gleaner App.\n\nGiven the following request GET /api/gleaner/traces/:traceId where:\n\n    gleaner is the prefix for the Gleaner App.\n    /traces/:traceId is the extracted route from the request.\n\nThis request will be forwarded to the following address:\n\n    http://localhost:3300/traces:traceId\n\nwith...\n\n{\n    ...data relevant to the parameter that goes after prefix...\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    ...data provided by the application this request was forwarded to...\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "InvalidPrefix",
            "description": "<p>You must provide a valid prefix!</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "ApplicationNotFound",
            "description": "<p>No application found with the given prefix: <prefix></p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "UndefinedHost",
            "description": "<p>It seems that the application <appName> has an undefined host.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/proxy.js",
    "groupTitle": "Proxy"
  },
  {
    "type": "delete",
    "url": "/roles/:roleName/resources/:resourceName/permissions/:permissionName",
    "title": "Deletes a permission",
    "name": "DelPermission",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "roleName",
            "description": "<p>Role name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "resourceName",
            "description": "<p>Resource name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "permissionName",
            "description": "<p>The permissions to delete.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    \"permission-1\",\n    \"permission-2\",\n    \"permission-3\"\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RolesDoesNotExist",
            "description": "<p>The role doesn't exist.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "PermissionDoesNotExist",
            "description": "<p>The permission of the resource doesn't exist.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "ResourceDoesNotExist",
            "description": "<p>The resource in role doesn't exist.</p>"
          }
        ],
        "403": [
          {
            "group": "403",
            "optional": false,
            "field": "LastPermission",
            "description": "<p>The permission can't be remove because is the last</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "delete",
    "url": "/roles/:roleName/resources/:resourceName",
    "title": "Deletes the resource with resourceName in roleName role",
    "name": "DelResource",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "roleName",
            "description": "<p>Role name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "resourceName",
            "description": "<p>Resource to delete.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"resources-1\": [\n        \"perm-1\"\n        \"perm-3\"\n   ]\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RolesDoesNotExist",
            "description": "<p>The role doesn't exist.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "ResourceDoesNotExist",
            "description": "<p>The resource in the role doesn't exist.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "delete",
    "url": "/roles/:roleName",
    "title": "Deletes the role with roleName.",
    "name": "DelRole",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "roleName",
            "description": "<p>Role name.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    \"Admin\"\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RolesRequired",
            "description": "<p>Roles required!.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "RolesDoesNotExist",
            "description": "<p>The role doesn't exist.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "RequiredResourcesAndPermissions",
            "description": "<p>Allows, or Resources and Permissions required!.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "RoleExists",
            "description": "<p>The role {roleName} already exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "get",
    "url": "/roles/:roleName/resources/:resourceName",
    "title": "Returns the permissions of resource resourceName in role roleName.",
    "name": "GetResources",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "roleName",
            "description": "<p>Role name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "resourceName",
            "description": "<p>Resource name.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    \"permission1\",\n    \"permission2\",\n    \"permission3\"\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RolesDoesNotExist",
            "description": "<p>The role doesn't exist.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "ResourceDoesNotExist",
            "description": "<p>The resource in role doesn't exist.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "get",
    "url": "/roles/:roleName",
    "title": "Returns the resources and permissions of role roleName",
    "name": "GetResources",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "roleName",
            "description": "<p>Role name.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"resources-1\": [\n        \"permission-1\"\n        \"permission-2\",\n        \"permission-3\"\n   ],\n   \"resources-2\": [\n        \"permission-3\"\n    ],\n    \"resources-3\": [\n        \"permission-1\",\n        \"permission-3\"\n    ],\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RoleExists",
            "description": "<p>The role {roleName}  doesn't exist.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "get",
    "url": "/roles/:roleName/users",
    "title": "Return the username of user with the role.",
    "name": "GetRoleUsers",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "roles",
            "description": "<p>Role name.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    \"user1\",\n    \"user2\",\n    \"user3\"\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RolesDoesNotExist",
            "description": "<p>The role doesn't exist.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "get",
    "url": "/roles",
    "title": "Return the all roles.",
    "name": "GetRoles",
    "group": "Roles",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    \"Role1\",\n    \"Role2\",\n    \"Role3\"\n]",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "post",
    "url": "/roles/:roleName/resources/:resourceName/permissions",
    "title": "Creates new permissions.",
    "name": "PostPermissions",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "roleName",
            "description": "<p>Role name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "resourceName",
            "description": "<p>Resource name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "permissions",
            "description": "<p>The new permissions.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"permission\" : [\n        \"perm-1\",\n        \"perm-3\"\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    \"permission\",\n    \"perm-1\",\n    \"perm-2\"\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RolesDoesNotExist",
            "description": "<p>The role doesn't exist.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "PermissionRequired",
            "description": "<p>Permissions required!.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "ResourceDoesNotExist",
            "description": "<p>The resource in role doesn't exist.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "post",
    "url": "/roles/:roleName/resources",
    "title": "Creates new resource with permissions for a role.",
    "name": "PostResources",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "allows",
            "description": "<p>Object with resources and permissions.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "resources",
            "description": "<p>Role resources.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "permissions",
            "description": "<p>Resources permissions</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"allows\":[\n        {\n            \"resources\":\"resource-1\",\n            \"permissions\":[\n                \"perm-1\",\n                \"perm-3\"\n            ]\n        },\n        {\n            \"resources\":[\n                \"resource-2\",\n                \"resource-3\"\n            ],\n            \"permissions\":[\"perm-1\"]\n        }\n    ]\n}",
          "type": "json"
        },
        {
          "title": "Request-Example:",
          "content": "{\n    \"resources\": [\n        \"resource-1\",\n        \"resource-2\",\n        \"resource-3\"\n],\n    \"permissions\": [\n         \"permission-1\",\n         \"permission-2\",\n         \"permission-3\"\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"resources-1\": [\n        \"perm-1\",\n        \"perm-3\"\n   ],\n   \"resources-2\": [\n        \"perm-1\"\n    ],\n    \"resources-3\": [\n        \"perm-1\"\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RolesDoesNotExist",
            "description": "<p>The role doesn't exist.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "RequiredResourcesAndPermissions",
            "description": "<p>Allows, or Resources and Permissions required!.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "post",
    "url": "/roles",
    "title": "Creates new roles.",
    "name": "PostRoles",
    "group": "Roles",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "roles",
            "description": "<p>Role name.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "allows",
            "description": "<p>Object with resources and permissions.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "resources",
            "description": "<p>Role resources.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "permissions",
            "description": "<p>Resources permissions</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"roles\":\"newRole\",\n    \"allows\":[\n        {\"resources\":\"resource-1\", \"permissions\":[\"perm-1\", \"perm-3\"]},\n        {\"resources\":[\"resource-2\",\"resource-3\"], \"permissions\":[\"perm-1\"]}\n    ]\n}",
          "type": "json"
        },
        {
          "title": "Request-Example:",
          "content": "{\n    \"roles\": \"newRole\",\n    \"resources\": [\n        \"resource-1\",\n        \"resource-2\",\n        \"resource-3\"\n],\n    \"permissions\": [\n         \"permission-1\",\n         \"permission-2\",\n         \"permission-3\"\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    \"Role1\",\n    \"Role2\",\n    \"newRole\"\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "RolesRequired",
            "description": "<p>Roles required!.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "RequiredResourcesAndPermissions",
            "description": "<p>Allows, or Resources and Permissions required!.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "RoleExists",
            "description": "<p>The role {roleName} already exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/roles.js",
    "groupTitle": "Roles"
  },
  {
    "type": "post",
    "url": "/signup/massive",
    "title": "Sign Up a group of users.",
    "name": "Signup",
    "group": "Signup",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "users",
            "description": "<p>Users array</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"users\": [{\n            \"username\": \"user1\",\n            \"password\": \"user1Pass\",\n            \"email\": \"user1@mail.es\"\n        },\n        {\n            \"username\": \"user3\",\n            \"password\": \"user3Pass\",\n            \"email\": \"user3@mail.es\",\n            \"role\" : \"roleName\",\n            \"prefix\": \"applicationName\"\n        },\n        {\n            \"username\": \"user2\",\n            \"password\": \"user2Pass\",\n            \"email\": \"user2@mail.es\"\n        }]\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n     \"msn\": \"Users registered\",\n     \"errors\": [],\n     \"errorCount\": 0\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UsersRequired",
            "description": "<p>The body need a json with users field.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "UsersArrayRequired",
            "description": "<p>The users field has to be a not empty array.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/signup.js",
    "groupTitle": "Signup"
  },
  {
    "type": "post",
    "url": "/signup",
    "title": "Sign Up an user.",
    "name": "Signup",
    "group": "Signup",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>User email.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>User username.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>User password</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "role",
            "description": "<p>Possible roles considering roles have been established with A2 for 'prefix' (it can be a strings)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "prefix",
            "description": "<p>Application prefix that has different roles that can be registered with</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"email\" : \"user@email.com\",\n    \"username\" : \"user\",\n    \"password\" : \"pass\",\n    \"role\" : \"roleName\",\n    \"prefix\": \"applicationName\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "     HTTP/1.1 200 OK\n     {\n\"user\": {\n     \"_id\": \"58d246c4ec32372c316d11aa\",\n     \"username\": \"user\",\n     \"email\": \"user@email.com\",\n     \"role\": \"roleName\",\n     \"prefix\": \"applicationName\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UsernameRequired",
            "description": "<p>Username required!.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "PasswordRequired",
            "description": "<p>Password required!.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "EmailRequired",
            "description": "<p>Email required!.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/signup.js",
    "groupTitle": "Signup"
  },
  {
    "type": "delete",
    "url": "/users/:userId",
    "title": "Removes the user.",
    "name": "DeleteUser",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "delete",
    "url": "/users/external/:domain/:externalId",
    "title": "Deletes the user using externalId",
    "name": "DeleteUserExternal",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "domain",
            "description": "<p>External domain</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "externalId",
            "description": "<p>External ID</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given external user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "delete",
    "url": "/users/:userId/externalId/:domain",
    "title": "Removes a externalId from the externalId of an user.",
    "name": "DeleteUserExternalId",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "domain",
            "description": "<p>ExternalId domain.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ],
        "403": [
          {
            "group": "403",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "delete",
    "url": "/users/:userId/roles",
    "title": "Removes a role from the roles of an user.",
    "name": "DeleteUserRole",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "get",
    "url": "/users/:userId",
    "title": "Gets the user information.",
    "name": "GetUser",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"username\": \"admin\",\n    \"email\": \"admin@email.es\",\n    \"timeCreated\": \"2015-07-06T09:03:52.636Z\",\n    \"verification\": {\n       \"complete\": false\n    },\n    \"name\": {\n        \"last\": \"\",\n        \"middle\": \"\",\n        \"first\": \"\"\n    }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "get",
    "url": "/users",
    "title": "Returns all users.",
    "name": "GetUsers",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "fields",
            "description": "<p>The fields to be populated in the resulting objects. An empty string will return the complete document (Query param).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "sort",
            "defaultValue": "_id",
            "description": "<p>Place - before the field for a descending sort (Query param).</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "limit",
            "defaultValue": "20",
            "description": "<p>(Query param)</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "page",
            "defaultValue": "1",
            "description": "<p>(Query param)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "api/users?limit=1&page=1",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"data\": [\n    {\n        \"_id\": \"559a447831b7acec185bf513\",\n        \"username\": \"admin\",\n        \"email\": \"admin@email.es\",\n        \"timeCreated\": \"2015-07-06T09:03:52.636Z\",\n        \"verification\": {\n            \"complete\": false\n        },\n        \"name\": {\n            \"last\": \"\",\n            \"middle\": \"\",\n            \"first\": \"\"\n        },\n        \"roles\" : [\"admin\"]\n    }],\n    \"pages\": {\n        \"current\": 1,\n        \"prev\": 0,\n        \"hasPrev\": false,\n        \"next\": 2,\n        \"hasNext\": true,\n        \"total\": 3\n   },\n    \"items\": {\n        \"limit\": 5,\n        \"begin\": 1,\n        \"end\": 3\n        \"total\": 3\n    }\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "get",
    "url": "/users/external/:domain/:externalId",
    "title": "Gets the user information using externalId",
    "name": "GetUsersExternal",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "domain",
            "description": "<p>External domain</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "externalId",
            "description": "<p>External ID</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"username\": \"admin\",\n    \"email\": \"admin@email.es\",\n    \"timeCreated\": \"2015-07-06T09:03:52.636Z\",\n    \"verification\": {\n       \"complete\": false\n    },\n    \"name\": {\n        \"last\": \"\",\n        \"middle\": \"\",\n        \"first\": \"\"\n    }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "get",
    "url": "/users/:userId/roles",
    "title": "Gets the user roles.",
    "name": "GetUsersRoles",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    \"Role1\",\n    \"Role2\"\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "post",
    "url": "/users/:userId/roles",
    "title": "Added a role to user.",
    "name": "PostUserRole",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": false,
            "field": "roles",
            "description": "<p>The new roles for the user.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "[\n    \"Role1\",\n    \"Role2\"\n]",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "post",
    "url": "/users/:userId/externalId",
    "title": "Adds externalId to user.",
    "name": "PostUserexternalId",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "externalId",
            "description": "<p>The new externalId for the user.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "[\n    { \"domain\" : \"Domain1\", \"externalId\" : \"id1\" },\n    { \"domain\" : \"Domain2\", \"externalId\" : \"id2\" }\n]",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "put",
    "url": "/users/:userId/password",
    "title": "Changes the user password.",
    "name": "PutUser",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "oldPassword.",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "newPassword.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"password\" : \"old_pass\",\n    \"newPassword\": \"new_pass\"\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"username\": \"userId\",\n    \"email\": \"your@email.com\",\n    \"name\": {\n        \"last\": \"Firstname\",\n        \"middle\": \"Middlename\",\n        \"first\": \"Lastname\"\n    },\n        \"roles\" : [\"user\"]\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "put",
    "url": "/users/:userId",
    "title": "Changes the user name and/or email.",
    "name": "PutUser",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          },
          {
            "group": "Parameter",
            "type": "[String]",
            "optional": false,
            "field": "email",
            "description": "<p>User email.</p>"
          },
          {
            "group": "Parameter",
            "type": "[Object]",
            "optional": false,
            "field": "name",
            "description": "<p>User name.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"email\" : \"your@email.com\",\n    \"name\": {\n        \"first\" : \"Firstname\",\n        \"middle\" : \"Middlename\",\n        \"last\" : \"Lastname\"\n    }\n}",
          "type": "json"
        }
      ]
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"_id\": \"559a447831b7acec185bf513\",\n    \"username\": \"admin\",\n    \"email\": \"your@email.com\",\n    \"timeCreated\": \"2015-07-06T09:03:52.636Z\",\n    \"verification\": {\n       \"complete\": false\n    },\n    \"name\": {\n        \"last\": \"Firstname\",\n        \"middle\": \"Middlename\",\n        \"first\": \"Lastname\"\n    },\n        \"roles\" : [\"admin\"]\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "get",
    "url": "/users/:userId/:resourceName/:permissionName",
    "title": "Returns true if the user has the permission for the resource. Otherwise returns false.",
    "name": "UserAllow",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "resourceName",
            "description": "<p>Resource name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "permissionName",
            "description": "<p>Permission name.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\ntrue",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "post",
    "url": "/users/:userId/verification/:token",
    "title": "Verify the user email.",
    "name": "Verification",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Verification token.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "admin"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "InvalidToken",
            "description": "<p>Password reset token is invalid or has expired.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  },
  {
    "type": "post",
    "url": "/users/:userId/verification",
    "title": "Send email to verify the user authenticity.",
    "name": "VerificationMail",
    "group": "Users",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>User id.</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Success.",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Success.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>No account with the given user id exists.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Users"
  }
] });
