'use strict';
var _ = require('lodash')
  , events = require('events')
  , Core = require('./core')
  , fs = require('fs')
  , makeReq = require('./common').makeReq
  , cache = require('./common').cache;

module.exports = function(accessToken, options) {
  //Verify contract.
  if(!accessToken) {
    throw 'Please provide an access token when instantiating your Collection.';
  }
  options = options || {};
  options.cacheFile = options.cacheFile ||  __dirname + '/.sparkCache.json';

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
      return false;
    }

    collection[newCore.name] = newCore;
  };

  function addCores(coreList) {
    var count = 0;
    //Add each core to the collection.
    _.each(coreList, function(core) {
      core.accessToken = accessToken;
      core = new Core(core);

      core.on('connect', function(newCore) {
        collection.add(newCore);

        //Cache each core's properties.
        _.extend(cache[newCore.id], newCore);

        //Save updated cache to disk.
        fs.writeFile(options.cacheFile, JSON.stringify(cache));

        if(!collection.connected && ++count === coreList.length) {
          collection.connected = true;
          emitter.emit('connect', coreList, 'Connected to the spark Cloud API');
        }
      });

      //Pass error down.
      core.on('error', function(err) {
        emitter.emit('error', err);
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
            if(!_.isArray(JSON.parse(fsCache))) {
              return;
            }

            addCores(JSON.parse(data));
          });
        }
      });
    }


    var opts = {
      path: '?access_token=' + accessToken
    };

    makeReq(opts, function(err, coreList) {
      if (err) {
        //Remove errors
        emitter.emit('error', err);
        return;
      } else if (JSON.stringify(coreList) !== fsCache) {

        //Filter out cores we already know about.
        var newCores = _.filter(coreList, function(core) {
          return !collection[core.name];
        });

        collection._cores = _.map(newCores, function(core) {
          return {
            name: core.name,
            id: core.id
          };
        });
        addCores(newCores);

        /*
         * TODO: Do this somewhere more useful.
        _.each(coreList, function(core) {
          cache.byName[core.name] = core;
          cache.byId[core.id] = core;
        });
        */

        //Keep the cache up to date.
        _.each(coreList, function(core) {
          if (cache.byId[core.id]) {
            _.extend(cache.byId[core.id], core);
          } else {
            cache.byId[core.id] = core;
          }

          cache.byName[core.name] = core;
        });

        //Store cache to disk. This should rarely change (unless you buy a new core).
        fs.writeFile(cacheFile, JSON.stringify(cache));

      }
    });
  });
  return;
};
