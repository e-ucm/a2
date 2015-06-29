var express = require('express'),
	router = express.Router(), 
	Q = require('q');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
