'use strict';
var https = require('https')
  , _ = require('lodash')
  , events = require('events');

module.exports = function Core (authtoken, deviceId) {
  //Definition object
  var core = this;
  var emitter = new events.EventEmitter();
  core.on = function(event, handler) {
    emitter.on(event, handler);
  };

  process.nextTick(function() {

    //Allow overloaded params.
    if (_.isObject(authtoken)) {
      var temp = authtoken.authtoken;
      delete authtoken.authtoken;
      _.extend(core, authtoken);
      authtoken = temp;
    } else {
      core.id = deviceId;
    }

    var coreOptions = apiOpts(authtoken);
    coreOptions.path += '/' + core.id;

    //Https request for spark information.
    var req = https.request(coreOptions, function(res) {
      res.on('data', function(d) {
        var data = JSON.parse(d.toString());

        //Add information from API to core.
        _.extend(core, data);

        //Dynamically add variables as a function on the core class.
        _.each(data.variables, function(variable) {

          //Add each core variable.
          core[variable] = function(callback) {
            //Request options.
            var opts = apiOpts(authtoken);
            opts.path += '/' + core.id + '/' + variable;

            var req = https.request(opts, function(res) {
              res.on('data', function(d) {
                var response = JSON.parse(d.toString());
                //Call the callback with the value.

                var data = response.result;

                core.lastApp = response.coreInfo.last_app;
                core.lastHeard = response.coreInfo.last_heard;
                core.connected = response.coreInfo.connected;

                //Handle temporary bug. https://community.sparkdevices.com/t/example-response-for-spark-variable/827
                if(_.isArray(data)) {
                  data = new Buffer(data).toString();
                }

                if(callback) {
                  //Handle undefined responses nicely.
                  if(data) {
                    callback(null, JSON.parse(d.toString()));
                  } else {
                    callback('No data returned by the API.');
                  }
                }
              });
            });
            req.end();
            req.on('error', function(err) {
              if(callback) {
                callback(err);
              }
            });
          };
        });

        //Dynamically add functions as, uh, functions... on the core class.
        _.each(data.functions, function(func) {
          core[func] = function(param, callback) {
            param = param || '';

            //Request options
            var opts = apiOpts(authtoken);
            opts.path += '/' + core.id + '/' + func;
            opts.method = 'POST';
            opts.headers['Content-Type'] = 'application/json';

            //Make request to cloud with params
            var req = https.request(opts, function(res) {
              res.on('data', function(d) {
                if(callback) {
                  //Handle undefined responses nicely.
                  if(data) {
                    callback(null, JSON.parse(d.toString()).return_value);
                  } else {
                    callback('Undefined was returned. Is you core powered on?');
                  }
                  //Call the callback with the value.
                }
              });
            });

            //Send param
            var Buf = new Buffer(JSON.stringify({args: param}));
            req.write(Buf);

            req.end();
            req.on('error', function(err) {
              if(callback) {
                callback(err);
              }
            });
          };
        });

        //Let everything know you're done loading.
        emitter.emit('connect', core);
      });
    });
    req.end();
    req.on('err', function(err) {
      throw err;
    });
  });
};
