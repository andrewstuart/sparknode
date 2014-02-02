#About

This package was built with the purpose of allowing cross-platform communication from node.js to a [sparkcore](http://www.spark.io) through the [spark Cloud API](http://docs.spark.io/#/api).

Firmware functions and variables are added automatically based on the spark API's HATEOS responses.

###[Example](#example-1)

#Exports
1. [Core](#core)
2. [Collection](#collection)

#CLI

If installed globally (`npm install -g sparknode`), sparknode will give you a command line interface mostly useful for debugging, but I suppose it could be used for other scripting applications as well.

The most important command is probably `spark -h`, as it lets you discover the functionality directly from the command line.

As for the rest, right now there are three main commands under the main `spark` command: `add`, `fn`, and `var`. Each of these also have help generated with the -h switch.

####add
Spark add will retreive any cores accessible via the given token. These are saved at your home directory under .sparkrc.

Syntax is `spark add <token>`.

####var
Retreive a variable from the spark cloud. Syntax is `spark var coreName varName`.
Options include: 
-n Number of times to check the variable (--number)
-i Interval, in seconds, between checks (--interval)
-c Check continously at interval or 1 second. (will override -n) (--continuous)

####fn
Execute a remote function and print the return value.  Syntax is `spark fn <coreName> <functionName> <argument>`.

####CLI Examples

```bash
#Go get all the cores.
spark add 1234567890abcdef1234567890abcdef;

spark fn core1 brew coffee;
spark fn core2 digitalwrite "A1,HIGH";

spark var core1 brewTime;
spark var -i.1 -n 5 core2 coffeeStrength;

#My current personal favorite:
spark var -ci .1 core1 variable1;
```

##Core
Create a new instance of a spark core. First parameter is authtoken, second parameter is deviceId.

An object can also be used as the first parameter, as follows:

```js
{
  authtoken: <Your Auth_Token>,
  id: <Your device id>
}
```

###Cloud Functions
Each function accepts a string as the parameter, and a callback to be called upon return.

The signature of the callback should be `function(err, data)`.

```javascript
core.brew('coffee', function(err, data) {
  //Do something
});
```

###Cloud Variables
Each variable (exposed as functions) accepts a callback as its first parameter, with the same signature as above (err, data).

```javascript
core.variable1(function(err, data) {
  console.log(data);
});
```

Variables also have a property, autoupdate, that can be set with a timeout in milliseconds between each call, or true to use the default 5 second interval or false to cancel autoupdates. Setting this variable will also start the update cycle.

When being used with autoupdate, the variable will fire an 'update' event each time a response is received from the server.

```javascript
//Start autoupdate
core.variable1.autoupdate = 2000;

//Do something on update
core.variable1.on('update', function(value) {
  console.log(value);
  console.log(core.variable1.value);
});

//Stop update with any falsy value.
core.variable1.autoupdate = false;

```

The last known value can be retreived as a property (value) of the function.

```javascript
console.log(core.variable1.value);
```

##Collection
Even better, get all your spark cores at once, complete with everything they can do.

Once loaded, the collection instance contains all your spark cores by name.

```javascript
collection.core1.doFunction('foo', function(err, data) {
  //Do something
});
```

The default behavior is to cache the output of the cloud api for all HATEOS calls in a JSON object at your project root.  If you'd like to override this behavior, you can pass an options object (optional, of course) to the constructor.

```javascript
var collection = new Collection(myAuthToken, { skipCache: true })
```
or
```javascript
var collection = new Collection(myAuthToken, { cacheFile: 'lib/cacheFile.json' } )
```

##Example

```javascript
var sp = require('sparknode');
var collection = new sp.Collection(myAuthToken);
collection.on('connect', function() {
  //Turn on an led
  collection.core1.digitalwrite('d7,HIGH');

  //Brew some coffee, then email me.
  collection.core2.brew('coffee', function(err, timeUntilFinished) {
    if(err) {
      throw err;
    }

    setTimeout(function() {
      //General awesomeness goes here.
      emailMe();
      sendSocketIoMessage();
      addCreamer();
    }, timeUntilFinished);
  })

  //Get a variable
  collection.core2.remainingCoffeeTime(function(err, value) {
    //Do something with value
  })
```

And an example of a single core.

```javascript
var randomCore = new sp.Core(myAuthToken, deviceId);

randomCore.on('connect', function() {
  randomCore.turnOnLights();
});
```

This library should also work cross platform as it doesn't rely on curl behind the scenes.  I'm hoping it also makes it much easier for me to wire custom functions to a webapp.

I'm also tracking some of the data that comes back from the spark cloud on the core objects themselves, such as `online`, though I'm not sure how useful that will end up being.

##Future

Future:

An API for the server sent events will also be a high priority as soon as that cloud API comes out.

I'd like to write a custom firmware that uses TCP directly. You're already using Node, so you have that option. It should be possible to write very powerful client-server code using something like this.

I'm also thinking about writing a custom firmware that lets you add many more than 4 functions, directly from the CLI or even programmatically, using string parsing on the client side. I don't know about anyone else, but I don't need 64 characters of input very often, so I figured they'd be more useful this way. Check out the issues tracker to add feature requests and see some of the plans I have.
