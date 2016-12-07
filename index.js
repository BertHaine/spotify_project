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
var SpotifyWebApi = require('spotify-web-api-node');

app.set('view engine', 'ejs');

app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'))
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

var spotifyApi = new SpotifyWebApi({
  clientID: process.env.SPOTIFY_APP_ID,
  clientSecret: process.env.SPOTIFY_SECRET,
  callbackURL: process.env.REDIRECT_URI
});


app.get('/', function(req, res) {
  if (req.user) {
    // console.log("token:", req.user.spotifyToken);
    spotifyApi.setAccessToken(req.user.spotifyToken);
  }
  res.render('index');
});

// app.get('/profile', isLoggedIn, function(req, res) {
//   var url = "https://graph.facebook.com/me/posts?access_token=" +
//     req.user.facebookToken + "";
//   request(url, function(error, response, body){
//     if (!error && response.statusCode == 200) {
//       var dataObj = JSON.parse(body);

//       var postArray = dataObj.data.filter(function(post){
//         return post.message;
//       });

//       res.send(postArray);
//     }
//     else {
//       console.log("error = " + error);
//       console.log(response.statusCode);
//     }
//   });
// });


app.get('/playlists', isLoggedIn, function(req, res) {
  spotifyApi.getUserPlaylists(req.user.spotifyId)
  .then(function(data) {
    // console.log('Retrieved playlists', data.body);
  },function(err) {
    // console.log('Something went wrong!', err);
  });
});



app.get('/search', isLoggedIn, function(req, res){
  if (req.user) {
    spotifyApi.setAccessToken(req.user.spotifyToken);
  }
  // do general search, from the results pull out the id https://api.spotify.com/v1/
  console.log("artist id:", req.query.name);

  spotifyApi.getArtistTopTracks('20qISvAhX20dpIbOOzGK3q', 'US')
  .then(function(data) {
    // console.log('Artist albums', data.body.tracks);
    // var spotifyData = data.body.tracks[3].name;
    // console.log('track name is ', spotifyData)
  res.render('search', {albums: data.body.tracks});
  }, function(err) {
    // console.error(err);
  });
});
  

app.get("/callback", passport.authenticate("spotify", {
  successRedirect: "/search",
  failureRedirect: "/",
  failureFlash: "An error occurred, try again.",
  successFlash: "You logged in via Spotify."
}));

app.use('/auth', require('./controllers/auth'));



var server = app.listen(process.env.PORT || 8888);
module.exports = server;
