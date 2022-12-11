var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var csrf = require('csurf');
var passport = require('passport');
const bodyParser = require('body-parser');
var logger = require('morgan');
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
// pass the session to the connect sqlite3 module
// allowing it to inherit from session.Store
var SQLiteStore = require('connect-sqlite3')(session);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Goat API",
      version: "1.0.0",
      description: "A simple Express API",
    },
    servers: [
      {
        url: "https://threeam.onrender.com"
      },
      {
        url: "http://localhost:3000"
      }
    ],
  },
  apis: ["./routes/*.js"],
};
const specs = swaggerJsDoc(options);

var app = express();

//app settings
app.locals.pluralize = require('pluralize');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
}));
//app.use(csrf());
app.use(passport.authenticate('session'));
app.use(function (req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;
  req.session.messages = [];
  next();
});
app.use(function (req, res, next) {
  //res.locals.csrfToken = req.csrfToken();
  next();
});

//routes

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var graphqlRouter = require('./routes/graph');
var wishesRouter = require('./routes/wishes');

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', wishesRouter);
app.use('/graphql', graphqlRouter);
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({ message: err.message });
  
});


module.exports = app;
