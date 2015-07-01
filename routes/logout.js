var express = require('express'),
    router = express.Router();

router.get('/', function(req, res) {
    req.logout();
    res.json({
        message: 'Success.'
    });
});

module.exports = router;