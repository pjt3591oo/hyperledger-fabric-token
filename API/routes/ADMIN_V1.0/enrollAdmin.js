var express = require('express');
var router = express.Router();

var enrollAdmin = require('../../utils/enrollAdmin')


router.post('/', async (req, res, next) => {
  let data = await enrollAdmin();
  console.log(data)
  res.json(data)
});

module.exports = router;
