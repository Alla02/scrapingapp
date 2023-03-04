var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var brandsRouter = require('./routes/brands');
var modelsRouter = require('./routes/models');
var propertiesRouter = require('./routes/properties');
var reportsRouter = require('./routes/reports');
var main = require('./routes/main');
var kiaRouter = require('./uploads/KIA');

var app = express();

var config = require('./config');
var mysql = require('mysql');
var pool = mysql.createPool(config.dbconnection);
var session = require('express-session');
var flash= require('connect-flash');
var bodyParser = require('body-parser');
var passport = require('passport');
const multer = require("multer");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

//For BodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multer({dest: "uploads/"}).single("filedata"));

// For Passport
app.use(session({secret: config.sessionSecret, saveUninitialized: true, resave: true})); 
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

var pp = require('./passport');
//all the good passport stuff are stored here (in pp.js)
pp.init(app);

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/', brandsRouter);
app.use('/', modelsRouter);
app.use('/', propertiesRouter);
app.use('/', reportsRouter);
app.use('/', kiaRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
