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
var get = require('lodash/get');

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

//Album
app.post('/album', isLoggedIn, function(req, res){

  console.log(req.body.artist);

  if (req.user) {
    spotifyApi.setAccessToken(req.user.spotifyToken);
  }
  
  // do general search, from the results pull out the id https://api.spotify.com/v1/
  var artist = req.body.artist;

  spotifyApi.searchArtists(artist)
  .then((data) => {
    const artist = get(data, 'body.artists.items')[0];
    const artistId = get(artist, 'id');

    console.log('Search artists results ', artistId);

    if (artistId) {
      return spotifyApi.getArtistTopTracks(artistId, 'US')
      .then(function(data) {

        const tracks = get(data, 'body.tracks');
        console.log(tracks);
        // console.log('Artist albums', data.body.tracks);
        // var spotifyData = data.body.tracks[3].name;
        // console.log('track name is ', spotifyData)
        if (tracks) {
          return res.render('album', {tracks: data.body.tracks});
        }
        res.render(new Error('No tracks found'));
      }, function(err) {
        console.error(err);
      });
    }
    console.log('No artist found');
  }, function(err) {
    console.error(err);
  });
});

app.get('/search', isLoggedIn, function(req, res){
  res.render('search');
})

app.get("/callback", passport.authenticate("spotify", {
  successRedirect: "/search",
  failureRedirect: "/",
  failureFlash: "An error occurred, try again.",
  successFlash: "You logged in via Spotify."
}));


app.post('/playlist', isLoggedIn, function(req, res) {
  if (req.user) {
    spotifyApi.setAccessToken(req.user.spotifyToken);
  }
  // req.body.name
  spotifyApi.createPlaylist(req.user.name, 'My Cool Playlist', { 'public' : false })
  .then(function(data) {
    console.log(data)
    spotifyApi.addTracksToPlaylist('thelinmichael', 
      '5ieJqeLJjjI8iJWaxeBLuK', 
      req.body.tracks)
    .then(function(data2) {
      console.log('Added tracks to playlist!', data2);
      
    }, function(err) {
      console.log('Something went wrong!', err);
    });

    console.log('Created playlist!');
  }, function(err) {
    console.log('Something went wrong!', err);
  });
});


app.use('/auth', require('./controllers/auth'));