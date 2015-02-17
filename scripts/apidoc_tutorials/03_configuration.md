
----------
## Overview ##

Configuration needs to be done per MagicasterJS installation. It's mainly done in the kickstart files (`kickstart.js` and `kickstart-dev.js`). 

The difference between these files are that by default `kickstart.js` turns on the production mode and includes the bundled and minified source file.

`kickstart-dev.js` on the other hand enables debugging and logging and leaves the JS file loading to RequireJS when needed (the standard AMD way).

**Note!** It's recommended to keep these two files in sync for most parts to unexpected behaviour when moving from development environment to production environment. Remember to run minification process when changing any other file than `kickstart.js` or `kickstart-dev.js`. 

## Configuration ##

Following configuration options are supported by MagicasterJS:

- `debug`: Boolean indicating whether logging and debugging is turned on.
- `clientName`: String indicating the name of the MagicasterJS client, that is sent to the server.
- `server`: Object containing server connection configuration.

## Asset resolvers ##

Asset resolvers map the different XML asset variants into actual paths to the resources.

Asset resolver is a function, which is bound to asset type. The implementation details are more or less MagicasterJS installation specific issues. Asset type `component` is used by the components by default.

	assetResolvers: {
		external: function(value) {
			return "http://external-server.com/external-path/"  + value + "?additionalInformation=somethingElse";
		},
		component: function(value) {
			return "components/" + parseComponentName(value);
		}
	}
