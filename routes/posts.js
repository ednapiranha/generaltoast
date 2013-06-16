'use strict';

module.exports = function (app, meat, nconf, isAdmin) {
  var request = require('request');
  var knox = require('knox');
  var MultiPartUpload = require('knox-mpu');
  var im = require('imagemagick');

  var utils = require('../lib/utils');

  var PHOTO_WIDTH = 400;
  var upload = null;

  var escapeHtml = function (text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  app.get('/recent', function (req, res) {
    meat.shareRecent(req.query.start || 0, function (err, posts) {
      res.json({
        posts: posts,
        total: meat.totalPublic
      });
    });
  });

  app.get('/post/:id', function (req, res, next) {
    meat.get(req.params.id, function (err, post) {
      if (err || (!req.session.email && post.meta.isPrivate)) {
        res.status(404);
        res.format({
          html: function () {
            next();
          },
          json: function () {
            res.send({ message: 'not found' });
          }
        });
      } else {
        res.format({
          html: function () {
            res.render('index', {
              url: '/post/' + req.params.id,
              page: 'post',
              prev: false,
              next: false
            });
          },
          json: function () {
            res.send({
              post: post,
              isAdmin: utils.isEditor(req),
              prev: false,
              next: false
            });
          }
        });
      }
    });
  });

  app.get('/all', function (req, res, next) {
    var pagination = utils.setPagination(req, meat);

    if (utils.isEditor(req)) {
      meat.getAll(req.query.start || 0, function (err, posts) {
        if (err) {
          res.status(404);
          res.json({ message: 'not found' });
        } else {
          res.json({
            posts: posts,
            isAdmin: true,
            prev: pagination.prev,
            next: pagination.next,
            total: meat.totalAll
          });
        }
      });
    } else {
      meat.shareRecent(req.query.start || 0, function (err, posts) {
        if (err) {
          res.status(404);
          res.json({ message: 'not found' });
        } else {
          res.json({
            posts: posts,
            isAdmin: false,
            prev: pagination.prev,
            next: pagination.next,
            total: meat.totalPublic
          });
        }
      });
    }
  });

  app.get('/add', isAdmin, function (req, res) {
    res.render('add', {
      url: null,
      isAdmin: true,
      page: 'edit',
      start: 0,
      total: 0
    });
  });

  app.get('/edit/:id', isAdmin, function (req, res) {
    meat.get(req.params.id, function (err, post) {
      var postUrl = '';
      if (post.content.urls.length > 0) {
        postUrl = post.content.urls[0].url;
      }

      res.render('edit', {
        post: post,
        postUrl: postUrl,
        geolocation: post.meta.location || '',
        url: '/edit/' + post.id,
        isAdmin: true,
        page: 'edit',
        start: 0,
        total: 0
      });
    });
  });

  app.post('/share', isAdmin, function (req, res, next) {
    request.get({ url: req.body.url, json: true }, function (err, resp, body) {
      if (err) {
        res.status(404);
        next();
      } else {
        body.post.meta.originUrl = req.body.url;
        meat.share(body.post, meat.postUrl, function (err, post) {
          if (err) {
            res.status(400);
            next(err);
          } else {
            res.json({ post: post });
          }
        });
      }
    });
  });

  var savePost = function (req, res, message, photoUrl, next) {
    if (req.body.url) {
      message.content.urls.push({
        title: escapeHtml(req.body.url),
        url: escapeHtml(req.body.url)
      });
    }

    if (photoUrl) {
      message.content.urls.push({
        title: photoUrl,
        url: photoUrl
      });
    }

    meat.create(message, function (err, post) {
      if (err) {
        callback(err);
      } else {
        message.meta.originUrl = nconf.get('domain') + ':' + nconf.get('authPort') +
          '/post/' + post.id;
        meat.update(message, function (err, post) {
          if (err) {
            res.status(400);
            next(err);
          } else {
            res.redirect('/');
          }
        });
      }
    });
  };

  var saveAndUpload = function (req, res, message, next) {
    if (req.files && req.files.photo && req.files.photo.size > 0) {
      im.resize({
        srcPath: req.files.photo.path,
        dstPath: req.files.photo.path,
        width: PHOTO_WIDTH,
        quality: 0.8,
        format: 'jpg'
      }, function (err, stdout, stderr) {
        if (err) {
          res.status(400);
          next(err);
        } else {
          var filename = 'post_' + (new Date().getTime().toString()) + '.' +
            req.files.photo.name.split('.').pop();
          var s3 = knox.createClient({
            key: nconf.get('s3_key'),
            secret: nconf.get('s3_secret'),
            bucket: nconf.get('s3_bucket')
          });

          upload = new MultiPartUpload({
            client: s3,
            objectName: filename,
            file: req.files.photo.path,
            headers: { 'Content-Type': req.files.photo.type }
          }, function(err, r) {
            if (err) {
              res.status(400);
              next(err);
            } else {
              savePost(req, res, message, s3.url(filename), next);
            }
          });
        }
      });
    } else {
      savePost(req, res, message, false, next);
    }
  };

  app.post('/add', isAdmin, function (req, res, next) {
    var message = {
      content: {
        message: escapeHtml(req.body.message),
        urls: []
      },
      meta: {
        location: req.body.geolocation,
        isPrivate: req.body.is_private || false,
        isShared: false
      },
      shares: []
    };

    saveAndUpload(req, res, message, next);
  });

  app.post('/edit/:id', isAdmin, function (req, res) {
    meat.get(req.params.id, function (err, post) {
      if (err) {
        res.status(400);
        res.json({ message: err.toString() });
      } else {
        post.content.message = req.body.message;
        if (req.body.url) {
          post.content.urls[0] = {
            title: req.body.url,
            url: req.body.url
          };
        } else {
          post.content.urls = [];
        }

        post.meta.isPrivate = req.body.is_private || false;
      }

      meat.update(post, function (err, post) {
        if (err) {
          res.status(400);
          res.json({ message: err.toString() });
        } else {
          res.redirect('/post/' + post.id);
        }
      });
    });
  });

  app.post('/delete/:id', isAdmin, function (req, res) {
    meat.del(req.params.id, function (err, status) {
      if (err) {
        res.status(400);
        res.json({ message: err.toString() });
      } else {
        res.json({ message: 'deleted' });
      }
    });
  });
};
