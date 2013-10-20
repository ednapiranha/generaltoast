'use strict';

exports.isEditor = function (req) {
  var whitelist = require('../whitelist');

  if (req.session && req.session.email &&
      whitelist.indexOf(req.session.email) > -1) {
    return true;
  }
  req.session.reset();
  return false;
};
