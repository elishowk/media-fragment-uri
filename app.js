'use strict';

/**
 * dependencies
 */
var express = require('express');
var app = express();
var fs = require('fs');
var parseMFQuery = require('./lib/fragmentparser.js');

/**
 * configuration: local
 */
var config = require('./config/env.' + process.env.NODE_ENV);
config(app);

/**
 * configuration: global
 */
app.configure(function () {
  /**
   * plugin: express-params
   */
  require('express-params').extend(app);

  /**
   * configuration: trust nginx
   */
  app.enable('trust proxy');

  /**
   * configuration: disable JSONP (security)
   */
  app.disable('jsonp callback');

  /**
   * middleware: views (jade)
   */
  app.set('views', 'views');
  app.engine('jade', require('jade').__express);

  /**
   * middleware: compress
   */
  app.use(express.compress());

  /**
   * middleware: router
   */
  app.enable('case sensitive routing');
  app.use(app.router);
});

/**
 * middleware: router
 */

app.get('/', function (req, res) {
  var validFragment = {};
  var value;
  for (var key in req.query) {
    if(req.query.hasOwnProperty(key)) {
      if(parseMFQuery[key]) {
        value = parseMFQuery[key](req.query[key].toString());
      }
      if (!value) {
        continue;
      }
      // keys may appear more than once,
      // thus store all values in an array,
      // the exception being "t"
      if (!validFragment[key]) {
        validFragment[key] = [];
      }
      if (key !== 't') {
        validFragment[key].push(value);
      } else {
        validFragment[key][0] = value;
      }
    }
  }
  res.render('proxy.jade', {
    'fragment': JSON.stringify(validFragment)
  });
});

/**
 * listen (on socket)
 */
if (fs.existsSync(config.bindTo)) {
  fs.unlinkSync(config.bindTo);
}

app.listen(config.bindTo);

console.log('listening: ' + config.bindTo);
