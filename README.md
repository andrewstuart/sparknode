#About

1. [Constructors](#Constructors)
2. [Methods](#Methods)

This package was built with the purpose of allowing cross-platform communication from node.js to a [sparkcore](http://docs.spark.io/#/api).

Firmware functions and variables are added automatically based on the spark API's HATEOS responses.

#Constructors

1. [Core](#core)
2. [Collection](#collection)

##Common

###Events

The main event you care about is connect.  This is fired when the cloud has returned and all variables and functions should be registered on your instance.

##Core
Create a new instance of a spark core. First parameter is authtoken, second parameter is deviceId.

An object can also be used as the first parameter, as follows:

```js
{
  authtoken: <Your Auth_Token>,
  id: <Your device id>
}
```

###Properties


###Functions

Each function accepts a string as the parameter, and a callback to be called upon return.

The signature of the callback should be `function(err, data)`.

##Collection
Even better, get all your spark cores at once, complete with everything they can do.

Not sure why, but this is a bit slower, at about 20 seconds.  I may cache these responses later for quicker reboots, but not yet, because once it's up, it's up.

Once loaded, the collection instance contains all your spark cores by name.
