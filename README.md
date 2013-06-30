# General Toast

This is a sample micro[b]log app using [meatspace](https://npmjs.org/package/meatspace).

## Installation

### Clone the repository

> git clone -b leveldb git://github.com/ednapiranha/generaltoast.git

### Install grunt

> npm install -g grunt-cli

### Copy over json files and adjust values as needed

> cp local.json-dist local.json

> cp whitelist.json-dist whitelist.json

whitelist.json contains emails that are allowed to manage posts.

Include your Amazone S3 key, secret and bucket in local.json so that you can upload photos.

### Install leveldb

If you're on OSX you can run the following:

> brew install leveldb

But it is preferable to do the following:

[Install leveldb manually](http://code.google.com/p/leveldb/downloads/list)

## Install imagemagick

> brew install imagemagick

### Differences from dev and prod

If you run this in dev, you don't need to do anything by default. If you run this in production:

* set your NODE_ENV to 'prod' (as in settings.js).
* set local.json's debug to false
* run grunt to minify js and css files

## Run the server

> node app.js

## Subscribing to other meatspaces

When you click on the 'S' in the top right hand corner after logging in, you can add urls to JSON feeds from other meatspace urls. For example, visiting [http://meatspace.generalgoods.net](http://meatspace.generalgoods.net) and clicking on 'Subscribe' gives you the feed for that site. Add that url to your subscription and your site will pull in the latest posts.
