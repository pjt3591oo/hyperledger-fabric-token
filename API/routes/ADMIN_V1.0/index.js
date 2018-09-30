var express = require('express');
var router = express.Router();

var enrollAdmin = require('./enrollAdmin');
var registerUser = require('./registerUser');

router.use('/enrollAdmin',enrollAdmin)
router.use('/registerUser',registerUser)

module.exports = router;
