'use strict';
var _ = require('lodash')
  , events = require('events')
  , makeReq = require('./common').makeReq;

module.exports = function Core (authtoken, deviceId) {
  //Definition object
  var core = this;
  var emitter = new events.EventEmitter();
  core.on = function(event, handler) {
    emitter.on(event, handler);
  };

  process.nextTick(function() {

    //Allow overloaded params, and hide authtoken.
    if (_.isObject(authtoken)) {
      var temp = authtoken.authtoken;
      delete authtoken.authtoken;
      _.extend(core, authtoken);
      authtoken = temp;
    } else {
      core.id = deviceId;
    }

    var coreOptions = {
      authtoken: authtoken,
      path: '/' + core.id
    };

    //Https request for spark information.
    makeReq(coreOptions, function(err, data) {
      if(err) {
        return emitter.emit('error', err);
      }

      //Add information from API to core.
      _.extend(core, data);

      //Dynamically add variables as a function on the core class.
      _.each(data.variables, function(variable) {

        var _updateInterval;
        var cancelUpdate = function() {};

        var emitterForVariable = new events.EventEmitter();

        core[variable].on = function(event, handler) {
          emitterForVariable.on(event, handler);
        };


        //Add each core variable.
        core[variable] = function(callback) {

          //Request options.
          var opts = {
            authtoken: authtoken,
            path: '/' + core.id + '/' + variable
          };


          makeReq(opts, function(err, data) {
            if(err) {
              return callback(err);
            }

            core.lastApp = data.response.coreInfo.last_app;
            core.lastHeard = data.response.coreInfo.last_heard;
            core.connected = data.response.coreInfo.connected;

            //Try to handle temporary spark buffer bug. 
            //https://community.sparkdevices.com/t/example-response-for-spark-variable/827
            if(_.isArray(data.response.result)) {
              data.response.result = new Buffer(data.response.result).toString();
            }

            if(callback) {
              if(data.response.result) {
                core[variable].value = data.response.result;
                callback(null, data.response.result);
              } else {
                //Handle undefined responses nicely.
                callback('No data returned by the API.');
              }
            }

            if(_updateInterval) {
              scheduleUpdate();
            }
          });
        };

        //Schedule an update
        function scheduleUpdate() {
          assert(_updateInterval, 'Update interval was unset.');

          cancelUpdate = setTimeout(function() {
            core[variable]( function(err, value) {
              if(err) {
                return emitter.emit('error', err);
              }

              emitterForVariable.emit('update', value);
              core.variables[variable] = value;
            });
          }, _updateInterval);
        }

        Object.defineProperty(core[variable], 'autoupdate', {
          writable: true,
          get: function() {
            return _updateInterval;
          },
          set: function(newVal) {
            if(_.isNumber(newVal)) {
              _updateInterval = Number(newVal);
              scheduleUpdate();
            } else if (newVal === true) {
              //Default update interval
              _updateInterval = 1000 * 15;
              scheduleUpdate();
            } else if (newVal === false) {
              _updateInterval = false;
              cancelUpdate();
            } else {
              throw 'variable.autoupdate must be a number or true or false.';
            }

            return _updateInterval;
          }
        });
      });

      //Dynamically add functions as, uh, functions... on the core class.
      _.each(data.functions, function(func) {
        core[func] = function(param, callback) {
          param = param || '';

          var opts = {
            authtoken: authtoken,
            path: '/' + core.id + '/' + func,
            method: 'POST',
            data: {
              args: param
            }
          };

          makeReq(opts, function(err, data) {
            if(err) {
              return emitter.emit('error', err);
            }

            if(callback) {
              //Handle undefined responses nicely.
              if(data) {
                callback(null, data.return_value);
              } else {
                callback('Undefined was returned. Is you core powered on?');
              }
            }
          });
          //Let everything know you're done loading.
          emitter.emit('connect', core);
        };
      });
    });
  });
};
