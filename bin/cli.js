#!/usr/bin/env node
'use strict';

var spark = require('commander')
  , pkg = require('../package.json')
  , version = pkg.version
  , Core = require('../lib/core.js')
  , Collection = require('../lib/collection.js')
  , fs = require('fs');

var config;

//http://stackoverflow.com/questions/9080085/node-js-find-home-directory-in-platform-agnostic-way
function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var rcFile = getUserHome() + '/.sparkrc';

function checkConfig (callback) {
  fs.exists(rcFile, function(exists) {
    if(exists) {
      fs.readFile(rcFile, function(err, data) {
        config = JSON.parse(data);
        callback(config);
      });
    } else {
      console.log('No devices have been added. Please use \'spark add\' first.');
      process.exit();
    }
  });
}


var fnCmd = spark.command('fn <core> <fn> [arg]')
  .description('Run a spark core function with argument')
  .action(fn);

//Function
function fn (core, fName, arg) {
  checkConfig(function() {
    var myCore = new Core(config.byName[core]);

    myCore.on('connect', function() {
      if(myCore.functions.indexOf(fName) > -1) {
        myCore[fName](arg, function(err, data) {
          console.log(data);
        });
      } else {
        console.log('The function you\'ve tried to call is not registered with the spark Cloud');
      }
    });
  });
}


var varCommand = spark.command('var <core> <variable>')
  .description('Get a spark core variable')
  .option('-n, --number <n>', 'Get an update n times')
  .option('-c, --continuous', 'Get continuous updates')
  .option('-i, --interval <i>', 'Interval, i,  in seconds.')
  .action(variable);
  
//Variable
function variable (core, varName) {
  var numCompletions = 0;

  checkConfig(function() {
    //Defaults

    //Get a new core.
    var myCore = new Core(config.byName[core]);

    //When connected
    myCore.on('connect', function() {
      if(!myCore.variables[varName]) {
        return console.log('The variable you\'ve tried to get is not registered with the spark Cloud');
      };

      if(varCommand.number || varCommand.continuous) {

        //Set autoupdate
        myCore[varName].autoupdate = varCommand.interval * 1000 || 1000;

        //Listen and log, stopping when necessary.
        myCore[varName].on('update', function(data) {
          if(varCommand.continuous || numCompletions++ < varCommand.number) {
            console.log(data);
          } else {
            myCore[varName].autoupdate = false;
          }
        });
      } else {
        myCore[varName](function(err, data) {
          console.log(data);
        });
      }
    });

    myCore.on('error', function(err) {
      console.log(err);
    });
  });
}

function add (newToken, id) {
  var result;

  if(id) {
    result = new Core(newToken, id);
  } else {
    result = new Collection(newToken, {cacheFile: rcFile});
  }

  result.on('connect', function() {
    console.log(result);
  });

  result.on('error', function(err) {
    console.log('ERROR: ', err);
  });
}

spark.command('add <token> [id]')
.description('Get either a spark collection or a single device')
.action(add);

spark.parse(process.argv);
