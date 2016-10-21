var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var db = require('../models');
require("dotenv").config();

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.user.findById(id).then(function(user) {
    cb(null, user);
  }).catch(cb);
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function(email, password, cb) {
  db.user.find({
    where: { email: email }
  }).then(function(user) {
    if (!user || !user.validPassword(password)) {
      cb(null, false);
    } else {
      cb(null, user);
    }
  }).catch(cb);
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.BASE_URL + "/auth/callback/facebook",
  profileFields: ["id", "email", "displayName", "posts", "feed"],
  enableProof: true
}, function(accessToken, refreshToken, profile, cb){
  //Pull the email from the profile if it exists
  var email = profile.emails ? profile.emails[0].value : null;

  //See if the user exists in the database (by the facebook email)
  db.user.find({
    where: {email: email}
  }).then(function(existingUser){
    if(existingUser && email){
      existingUser.updateAttributes({
        facebookId: profile.id,
        facebookToken: accessToken
      }).then(function(updatedUser){
        cb(null, updatedUser);
      }).catch(cb);
    }
    else {
      db.user.findOrCreate({
        where: {facebookId: profile.id},
        defaults: {
          facebookToken: accessToken,
          name: profile.displayName,
          email: email
        }
      }).spread(function(user, created){
        if(created){
          return cb(null, user);
        }
        else {
          user.facebookToken = accessToken;
          user.save().then(function(){
            cb(null, user);
          }).catch(cb);
        }
      }).catch(cb);
    }
  });
}));

module.exports = passport;
