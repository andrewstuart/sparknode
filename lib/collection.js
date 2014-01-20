'use strict';
var _ = require('lodash')
  , events = require('events')
  , Core = require('./core')
  , makeReq = require('./common').makeReq;

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
    var opts = {
      path: '?access_token=' + authtoken
    };

    makeReq(opts, function(err, coreList) {
      var count = 0;

      //Add each core to the collection.
      _.each(coreList, function(core) {
        core.authtoken = authtoken;
        core = new Core(core);

        core.on('connect', function() {
          collection.add(core);

          if(++count === coreList.length) {
            emitter.emit('connect', coreList, 'Connected to the spark Cloud API');
          }
        });
      });
    });
  });

  return;
};
