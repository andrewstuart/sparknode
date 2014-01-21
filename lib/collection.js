'use strict';
var _ = require('lodash')
  , events = require('events')
  , Core = require('./core')
  , fs = require('fs')
  , makeReq = require('./common').makeReq;

module.exports = function(authtoken, options) {
  //Verify contract.
  if(!authtoken) {
    throw 'Please provide an authtoken when instantiating your Collection.';
  }
  options = options || {};
  options.cacheFile = options.cacheFile || './sparkCache.json';

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

  function addCores(coreList) {
    var count = 0;
    //Add each core to the collection.
    _.each(coreList, function(core) {
      core.authtoken = authtoken;
      core = new Core(core);

      core.on('connect', function() {
        collection.add(core);

        if(!collection.connected && ++count === coreList.length) {
          collection.connected = true;
          emitter.emit('connect', coreList, 'Connected to the spark Cloud API');
        }
      });
    });
  }

  process.nextTick(function() {
    var cacheFile = options.cacheFile;
    var fsCache = '';

    if(!options.skipCache) {
      //Check for cached collection details as this is the slower call.
      fs.exists(cacheFile, function(exists) {
        if(exists) {
          fs.readFile(cacheFile, function(err, data) {
            fsCache = data.toString();

            //Handle bad data.
            if(!_.isObject(fsCache)) {
              return;
            }

            addCores(JSON.parse(data));
          });
        }
      });
    }


    var opts = {
      path: '?access_token=' + authtoken
    };

    makeReq(opts, function(err, coreList) {
      if(JSON.stringify(coreList) !== fsCache) {

        var coresToAdd = _.filter(coreList, function(core) {
          return !collection[core.name];
        });

        addCores(coresToAdd);
        //Store cache to disk this should rarely change.
        fs.writeFile(cacheFile, JSON.stringify(coreList));
      }
    });
  });
  return;
};
