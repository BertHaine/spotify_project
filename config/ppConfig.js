var passport = require('passport');
var SpotifyStrategy = require("passport-spotify").Strategy;
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

// passport.use(new LocalStrategy({
//   usernameField: 'email',
//   passwordField: 'password'
// }, function(email, password, cb) {
//   db.user.find({
//     where: { email: email }
//   }).then(function(user) {
//     if (!user || !user.validPassword(password)) {
//       cb(null, false);
//     } else {
//       cb(null, user);
//     }
//   }).catch(cb);
// }));

passport.use(new SpotifyStrategy({
  clientID: process.env.SPOTIFY_APP_ID,
  clientSecret: process.env.SPOTIFY_SECRET,
  callbackURL: process.env.REDIRECT_URI
}, function(accessToken, refreshToken, profile, cb){
  //Pull the email from the profile if it exists
  var email = profile.emails ? profile.emails[0].value : null;

  //See if the user exists in the database (by the facebook email)
  db.user.find({
    where: {email: email}
  }).then(function(existingUser){
    if(existingUser && email){
      existingUser.updateAttributes({
        spotifyId: profile.id,
        spotifyToken: accessToken
      }).then(function(updatedUser){
        cb(null, updatedUser);
      }).catch(cb);
    }
    else {
      db.user.findOrCreate({
        where: {spotifyId: profile.id},
        defaults: {
          spotifyToken: accessToken,
          name: profile.display_name,
          email: email
        }
      }).spread(function(user, created){
        if(created){
          return cb(null, user);
        }
        else {
          user.spotifyToken = accessToken;
          user.save().then(function(){
            cb(null, user);
          }).catch(cb);
        }
      }).catch(cb);
    }
  });
}));

module.exports = passport;
