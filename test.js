'use strict'

var opts = {
  hostname: 'api.spark.io',
  path: '/v1/events',
  method: 'GET',
  headers: {
    authorization: 'Bearer ' + '9b0d91c2f43c4f740e760a4c66c3ddfa5e5e28b9'
  }
}

var https = require('https');
var events = require('events');


function getEvents(opts) {
  var emitter = new events.EventEmitter();

  var req = https.request(opts, function(res) {

    var lastEventName;

    res.on('data', function(data) {
      if(data[0].toString() === ':') {return;} //Drop ':ok' message

      var lines = data.toString().split(/\n/);

      var map = {};

      lines.filter(function(string) {
        return string;
      }).forEach(function(line) {
        var array = line.split(': ');
        map[array[0]] = array[1];
      });

      if(!map.data) {
        if(map.event) {
          lastEventName = map.event;
          return;
        }
      } else {
        map.data = JSON.parse(map.data);
      }

      if(!map.event && lastEventName) {
        map.event = lastEventName;
        lastEventName = undefined;
      }

      if(map.event && map.data) {
        emitter.emit('event', map);
        emitter.emit(map.event, map.data);
      }
    });

    res.on('error', function (e) {
      emitter.emit('error', e);
    });
  });

  //req.setSocketKeepAlive(true);

  req.on('error', function (e) {
    console.log(e);
  });

  req.end();

  //With great power comes great responsibility.
  return emitter;
}

getEvents(opts).on('event', function(event) {if(event.event !== 'motion-detected2') console.log(event);});
