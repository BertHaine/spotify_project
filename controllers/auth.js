var express = require('express');
var passport = require("../config/ppConfig");
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');

router.get('/signup', function(req, res) {
  res.render('auth/signup');
});

// router.get('/login', function(req, res) {
//   res.render('auth/login');
// });

// router.post('/login', passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/auth/login',
//   failureFlash: 'Invalid username and/or password',
//   successFlash: 'You have logged in'
// }));

router.get('/logout', function(req, res) {
  req.logout();
  req.flash('success', 'You have logged out');
  res.redirect('/');
});

router.get("/spotify", passport.authenticate("spotify", {
  scope: ['user-read-email', 'user-read-private']
}));


module.exports = router;
