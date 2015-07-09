var express = require('express'),
    authentication = require('../util/authentication'),
    router = express.Router();

router.delete('/', authentication.authenticated, function (req, res) {
    req.logout();
    req.app.tokenStorage.delete(req);
    res.json({
        message: 'Success.'
    });
});

module.exports = router;