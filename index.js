var express = require('express');
var ejsLayouts = require('express-ejs-layouts');
var bodyParser = require('body-parser');
var passport = require('./config/ppConfig');
var session = require('express-session');
var request = require("request");
var flash = require('connect-flash');
var isLoggedIn = require('./middleware/isLoggedIn');
require("dotenv").config();
var app = express();

app.set('view engine', 'ejs');

app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(ejsLayouts);
app.use(session({
  secret: process.env.SESSION_SECRET || "brandikey",
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.alerts = req.flash();
  next();
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/profile', isLoggedIn, function(req, res) {
  var url = "https://graph.facebook.com/me/posts?access_token=" +
    req.user.facebookToken + "";
  request(url, function(error, response, body){
    if (!error && response.statusCode == 200) {
      var dataObj = JSON.parse(body);

      var postArray = dataObj.data.filter(function(post){
        return post.message;
      });

      res.send(postArray);
    }
    else {
      console.log("error = " + error);
      console.log(response.statusCode);
    }
  });
});

app.use('/auth', require('./controllers/auth'));

var server = app.listen(process.env.PORT || 3000);

module.exports = server;
