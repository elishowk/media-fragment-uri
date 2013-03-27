'use strict';

/**
 * configuration: REPLACE_WITH_ENV (process.env.NODE_ENV)
 */
var config = module.exports = function (app) {
  var express = require('express');

  /**
   * middleware: logger
   */
  app.use(express.logger('REPLACE_WITH_LOGGER_NAME'));

  /**
   * locals
   */
  app.locals({
    'baseUrl': 'REPLACE_WITH_ROOT_URL',
    'apiUrl': 'REPLACE_WITH_API_URL',
    'socketUrl': 'REPLACE_WITH_SOCKET_URL',
    'dashboardUrl': 'REPLACE_WITH_DASHBOARD_URL',
  });
};

config.bindTo = '/tmp/commonplay-frontoffice-widget-playbox.socket';
