var express = require('express');
var router = express.Router();

var account = require('./account');
var transaction = require('./transaction');
var receipt = require('./receipt');

router.use('/account', account)
router.use('/transaction', transaction)
router.use('/receipt', receipt)

module.exports = router;
