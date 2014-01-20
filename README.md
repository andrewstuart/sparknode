#About

This package was built with the purpose of allowing cross-platform communication from node.js to a [sparkcore](http://docs.spark.io/#/api).

Firmware functions and variables are added automatically based on the spark API's HATEOS responses.

#Constructors
1. [Core](#core)
2. [Collection](#collection)
3. [Example](#example)

##Common
###Events
The main event you care about is connect.  This is fired when the cloud has returned and all variables and functions should be registered on your instance. This is true for both Core and Collection.

##Core
Create a new instance of a spark core. First parameter is authtoken, second parameter is deviceId.

An object can also be used as the first parameter, as follows:

```js
{
  authtoken: <Your Auth_Token>,
  id: <Your device id>
}
```

###Functions
Each function accepts a string as the parameter, and a callback to be called upon return.

The signature of the callback should be `function(err, data)`.

###Variables
Each variable (exposed as functions) accepts a callback as a parameter, with the same signature as above (err, data).

##Collection
Even better, get all your spark cores at once, complete with everything they can do.

Once loaded, the collection instance contains all your spark cores by name.

Not sure why the cloud api takes forever to return my two spark cores, but this one takes at about 20 seconds.  I may cache these responses later for quicker reboots, but not yet, because once it's up, it's speedy.

##Example

```javascript
var sp = require('sparknode');
var collection = new sp.Collection(myAuthToken);
collection.on('connect', function() {
  //Turn on an led
  collection.core1.digitalwrite('d7,HIGH');

  //Brew some coffee, then email me.
  collection.core2.brew('coffee', function(err, timeUntilFinished) {
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
