var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var API_V1 = require('./routes/API_V1.0');
var ADMIN_V1 = require('./routes/ADMIN_V1.0');

var query = require('./utils/query')
var invoke = require('./utils/invoke')

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/v1.0', API_V1);
app.use('/admin/v1.0', ADMIN_V1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

setInterval(async () => {
  let searchData= await query({fcn: "get_account", args: ["227490b3c5f6226d6732cf836505e8abe22eadf2d4e407fff9dbafa66d145226"]})
  let {code, data} = await invoke({fcn: "create_account", args: ["test44141414165", "1234"]})
  // console.log('======query result=======')
  // console.log(`time: ${new Date()}, data: ${JSON.stringify(searchData)}`)

  // console.log('======invoke result=======')
  // console.log(`time: ${new Date()}, data: ${data}`)
}, 10000)

module.exports = app;
