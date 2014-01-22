'use strict';

var assert = require('assert')
  , Core = require('../lib/core')
  , common = require('../lib/common')
  , nock = require('nock')
  , _ = require('lodash')._;

var a;
var spark;
var myFuncs = [ 'getdata',
  'digitalread',
  'digitalwrite',
  'analogread'
];

describe('core constructor', function() {

  beforeEach(function() {
    a = new Core('foo', 'bar');

    spark = nock('https://api.spark.io').get('/v1/devices/bar').reply(200, {
      id: '1234567890abcdef12345678',
      name: 'core1',
      variables: {
        delay: 'int32'
      },
      functions: myFuncs
    });
  });

  afterEach(function() {
  });

  it('should add functions for each function returned by the server.', function(done) {
    a.on('connect', function() {
      _.each(myFuncs, function (expectedFunction) {
        assert(!!a[expectedFunction], 'core "a" was expected to have a ' + expectedFunction + ' function');
      });
      done();
    });
  });

  it('should add a variable to the core was well', function(done) {
    a.on('connect', function() {
      assert(!!a.delay, 'Variable was not added.');
      done();
    });
  });


});



