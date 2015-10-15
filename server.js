'use strict';

var express = require('express');
var browserify = require('browserify');
var watchify = require('watchify');
var app = express();
var port = process.env.port || 5000;
var path = require('path');
var cachedBundle = '';

var b = watchify(browserify(require.resolve('./index')));

b.on('update', function () {
  b.bundle(onBundle);
});
b.bundle(onBundle);

function onBundle(err, buf) {
  if (err) {
    console.error(err);
    return;
  }

  console.log('created bundle');
  cachedBundle = buf.toString();
}

app.get('/styler.js', function (req, res, next) {
  res
    .set('Content-Type', 'text/javascript')
    .send(cachedBundle);
});

app.get('/', function (req, res, next) {
  res
    .sendFile(path.join(__dirname, '/example/index.html'));
});

app.listen(port);
console.log('Listening on port ' + port);
