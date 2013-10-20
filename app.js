var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var Meatspace = require('meatspace-leveldb');
var settings = require('./settings')(app, configurations, express);
var whitelist = require('./whitelist');

nconf.argv().env().file({ file: 'local.json' });

/* Filters for routes */

var isAdmin = function (req, res, next) {
  if (req.session.email && whitelist.indexOf(req.session.email) > -1) {
    next();
  } else {
    res.redirect('/logout');
  }
};

/* Initialize meat */

var meat = new Meatspace({
  fullName: nconf.get('full_name'),
  username: nconf.get('username'),
  postUrl: nconf.get('url'),
  db: nconf.get('db'),
  limit: 13
});

require('express-persona')(app, {
  audience: nconf.get('domain') + ':' + nconf.get('authPort')
});

// routes
require('./routes')(app, meat, nconf, isAdmin);
require('./routes/posts')(app, meat, nconf, isAdmin);
require('./routes/subscriptions')(app, meat, nconf, isAdmin);

app.listen(process.env.PORT || nconf.get('port'));
