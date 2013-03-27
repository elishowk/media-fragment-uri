'use strict';

var mongoose = require('mongoose');

/**
 * Set model `widget`
 */
var Widget = require('frontoffice-schema').Widget;

var db = module.exports = mongoose.createConnection();
db.model('widget', Widget);
