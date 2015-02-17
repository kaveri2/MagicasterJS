#MagicasterJS

##Introduction

MagicasterJS is an HTML5 based framework for rendering Magicast components. It can work independently or connect to MagicasterCMS, which provides Magicast data.

##Documentation

This chapter will contain the documentation about the framework itself with links to more detailed description.

## Updating or modifying the framework ##

#!!! Important !!!

__IF YOU READ ONLY A PART OF THE DOCUMENTATION, PLEASE READ THIS :D__

There's an umbrella script (`genall.cmd`) which takes care of the three required tasks when publishing the framework:

1. Minification of the source assets
2. Combining new theme file(s)
3. Reconstructing the API specifications

Genall -script hides the usage of the the following tools:

### Minification 

By default production-enabled `kickstart.js` -loader tries to load `magicaster.min.js` -named file. When modifications have been made to the core framework the minified version of the javascript framework **has to be regenerated** using:

	scripts\minified.cmd  (on windows)
or 

	scripts/minified.sh (on *nix/mac)

Otherwise the changes made to the sources are not baked into the production code.

### API documentation
API documentation is created from the sources using JSDoc. More information about JSDoc can be found from: [http://usejsdoc.org/](http://usejsdoc.org/) 

    scripts\apidoc.cmd (on windows)
or 

    scripts/apidoc.sh (on *nix/mac)

If you want to change e.g. documentation template, you need to update these two scripts to point into correct templates.

##Running Examples

###Prerequisites

Web server to host the example files, or use simple Node.js server, which will automatically be installed.

	node server.js

###Running examples

Examples are stand-alone web sites, which can be found from gug-subdirectory. Due to cross-origin requests (asynchronous javascript loadings etc), the easiest way is to host the example content in some web server.

Host gug-subdirectory in the webserver you choose. After that point the browser to example directories to run the examples.

##Testing

Tests are implemented using Mocha testing framework and Karma test runner. JSHint can be used to do static code analysis.

###Prerequisites

Node and NPM  need to be installed and found from $PATH.

* Node: [http://nodejs.org/](http://nodejs.org/)  (Node Package Manager NPM comes bundled in the installation)

###Install dependencies
	
	# npm install
