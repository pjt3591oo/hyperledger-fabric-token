var express = require('express');
var router = express.Router();

var registerUser = require('../../utils/registerUser')

router.post('/', async (req, res, next) =>  {
  let a = await registerUser();
  console.log(data)
  res.json(data)
});

module.exports = router;
