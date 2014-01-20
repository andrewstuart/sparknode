'use strict';
var https = require('https')
  , _ = require('lodash')
  , events = require('events')
  , Core = require('./core')
  , apiOpts = require('./common').apiOpts;

module.exports = function(authtoken) {
  //Verify contract.
  if(!authtoken) {
    throw 'Please provide an authtoken when instantiating your Collection.';
  }

  //Maintain a reference to the collection.
  var collection = this;

  //A new event emitter for each core.
  var emitter = new events.EventEmitter();
  collection.on = function(event, handler) {
    emitter.on(event, handler);
  };

  collection.add = function add (newCore) {
    //Collection must only contain cores.
    if(!(newCore instanceof Core)) {
      emitter.emit('error', 'Collection cannot contain a non-core');
    }

    collection[newCore.name] = newCore;
  };

  process.nextTick(function() {
    var sparkOptions = apiOpts(authtoken);

    var req = https.request(sparkOptions, function(res) {
      res.on('data', function(d) {
        //TODO: Maybe cache this stuff so we can reconnect faster.

        var message = 'Connected to spark.io api.';
        var apiCollection = JSON.parse(d.toString());

        var count = 0;
        //Add each core to the collection.
        _.each(apiCollection, function(core) {
          core.authtoken = authtoken;
          core = new Core(core);

          core.on('connect', function(newCore) {
            collection.add(newCore);

            if(++count === apiCollection.length) {
              emitter.emit('connect', apiCollection, message + d.toString());
            }
          });
        });
      });
    });

    req.end();
    req.on('error', function(err) {
      throw err;
    });
  });

  return;
};
