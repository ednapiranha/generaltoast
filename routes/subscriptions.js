'use strict';

module.exports = function (app, meat, nconf, isAdmin) {
  var request = require('request');

  var SUBSCRIPTION_MAX = 12;

  app.get('/subscription/all', function (req, res) {
    meat.getSubscriptions(function (err, subscriptions) {
      if (err) {
        res.status(400);
        next(err);
      } else {
        var posts;
        var count = 0;

        subscriptions.forEach(function (currSubscription) {
          meat.getSubscriptionRecent(currSubscription, function (err, pArr) {
            count ++;
            if (!err) {
              if (!posts) {
                posts = pArr;
              } else {
                posts = posts.concat(pArr);
              }
            }

            if (count === subscriptions.length) {
              posts = posts.sort(function (a, b) {
                return parseInt(b.content.created, 10) - parseInt(a.content.created, 10);
              });
              if (posts.length > SUBSCRIPTION_MAX) {
                posts.splice(SUBSCRIPTION_MAX, posts.length - SUBSCRIPTION_MAX);
              }
              res.json({ posts: posts });
            }
          });
        });
      }
    });
  });

  app.get('/subscription/add', isAdmin, function (req, res) {
    res.render('subscription_add', { url: null, isAdmin: true });
  });

  app.post('/subscription/add', isAdmin, function (req, res) {
    meat.subscribe(req.body.url, function (err, subscription) {
      if (err) {
        res.status(400);
        next(err);
      } else {
        res.redirect('/subscription/manage');
      }
    });
  });

  app.get('/subscription/manage', isAdmin, function (req, res, next) {
    meat.getSubscriptions(function (err, subscriptions) {
      if (err) {
        res.status(400);
        next(err);
      } else {
        res.render('subscription_manage', {
          url: null,
          isAdmin: true,
          subscriptions: subscriptions,
          page: 'subscriptions'
        });
      }
    });
  });

  app.post('/subscription/unsubscribe', isAdmin, function (req, res) {
    meat.unsubscribe(req.body.url, function (err, status) {
      if (err) {
        res.status(400);
        res.json({ message: err.toString() });
      } else {
        res.json({ message: 'unsubscribed' });
      }
    });
  });
};
