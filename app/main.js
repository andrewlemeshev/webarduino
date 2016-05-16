var express = require('express');
var app = express();
var pages = require(__dirname + '/controllers/pages.js');
var ejsLocals = require('ejs-locals');
var fs = require('fs');

// configuration settings
app.engine('ejs', ejsLocals);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.static('public'));

// set view locals
app.use(function (req, res, next) {
  app.locals.route = req.url;
  next();
});

// mount routes
app.get('/', pages.home);
app.get('/about', pages.about);
app.post('/getjson', function(req, res){
  var json;
  console.log('body: ' + req.body);
  fs.readFile('arduinoElements.json', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    //console.log(data);
    res.send(data);
    //json = data;
  });

  //res.send(json);
});
//app.get('/404', pages.err404)

app.use(function(req, res, next) {
  res.redirect('404');
});

module.exports = app;
