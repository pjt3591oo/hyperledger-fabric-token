var express = require('express');
var router = express.Router();

var chaincode = require('./chaincode');

router.use('/chaincode', chaincode)

module.exports = router;
