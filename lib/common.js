'use strict';
var https = require('https')
  , _ = require('lodash');

function defaultOptions (auth) {
  var options = {
    hostname: 'api.spark.io',
    path: '/v1/devices',
    method: 'GET',
    headers: {}
  };

  if(auth) {
    options.headers.Authorization = 'Bearer ' + auth;
  }

  return options;
}

function makeReq (options, callback) {
  //Default http request options.
  var requestOptions = defaultOptions(options.authtoken);

  //Augment the default options.
  requestOptions.path += (options.path ? options.path : '');
  requestOptions.method = options.method || requestOptions.method;
  _.extend(requestOptions.headers, options.headers);

  //Short-circuit boolean test and data reference
  var dataToSend = ['PUT','POST','PATCH'].indexOf(options.method) > -1 && options.data;

  if(dataToSend) {
    requestOptions.headers['Content-Type'] = 'application/json';
  }

  //Storage for the data chunks.
  var data = '';

  var req = https.request(requestOptions, function(res) {
    res.on('data', function(d) {
      data += d;
    });

    res.on('end', function() {
      if(callback) {
        if(data) {
          callback(null, JSON.parse(data));
        } else {
          callback('No data returned by the API.');
        }
      }
    });
  });

  //Send when appropriate
  if(dataToSend) {
    var buf = new Buffer(JSON.stringify(dataToSend));
    req.write(buf);
  }

  req.end();

  req.on('error', function (err) {
    if(callback) {
      callback(err);
    }
  });
}

exports.defaultOptions = defaultOptions;
exports.makeReq = makeReq;
