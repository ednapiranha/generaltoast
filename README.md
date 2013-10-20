# General Toast

This is a sample micro[b]log app using [meatspace](https://npmjs.org/package/meatspace).

## Installation

### Clone the repository

> git clone git://github.com/ednapiranha/generaltoast.git

### Install grunt and nodemon

> npm install -g grunt-cli nodemon

### Copy over json files and adjust values as needed

> cp local.json-dist local.json

> cp whitelist.json-dist whitelist.json

whitelist.json contains emails that are allowed to manage posts.

Include your Amazone S3 key, secret and bucket in local.json so that you can upload photos.

### Install and start redis

> brew install redis

> redis-server

## Install imagemagick

> brew install imagemagick

### Differences from dev and prod

If you run this in dev, you don't need to do anything by default. If you run this in production:

* set your NODE_ENV to 'prod' (as in settings.js).
* set local.json's debug to false
* run grunt to minify js and css files

## Run the server

> npm start

## Subscribing to other meatspaces

When you click on the 'S' in the top right hand corner after logging in, you can add urls to JSON feeds from other meatspace urls. For example, visiting [http://meatspace.generalgoods.net](http://meatspace.generalgoods.net) and clicking on 'Subscribe' gives you the feed for that site. Add that url to your subscription and your site will pull in the latest posts.
