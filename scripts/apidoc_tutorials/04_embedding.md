
----------
## Overview ##

This tutorial describes the basics to embed Magicasts to the web page. It does cover the positioning and layout questions, as there are tutorial describing those topics.

## Pre-requisites and dependencies ##

Dependencies (such as jQuery and Lo-Dash) are bundled in the core framework, which is loaded by the kickstart.

## Including MagicasterJS kickstart ##

MagicasterJS contains single kickstart file, which takes care of the rest. Load it to the web page as any other JavaScript file:

    <script type="text/javascript" src="http://gug.azurewebsites.net/gug/src/kickstart.js"></script>

MagicasterJS has also development version, which provides console logging support. To utilize this version, use kickstart-dev.js instead of the original:

    <script type="text/javascript" src="http://gug.azurewebsites.net/gug/src/kickstart-dev.js"></script>

## Loader support ##

It's completely optional to use a loader on top of the page during loading sequence. However an external utility loader has been implemented to hide the Magicast loading sequence from the end user. The following scripts assumes that ***loader.gif*** can be found from the root directory for the web page.

    <script type="text/javascript" src="../blogutils/loaderui.js"></script>

Note: If you want to customize or change the graphics used by the loader, the reference to the graphics can be found from the loaderui.js -javascript file.

    var loaderCSS = {
    	position: "fixed",
    	left: "0",
    	top: "0",
    	bottom: "0",
    	right: "0",
    	"z-index": "999999999",
    	"background-color": "white",
    	"background-image": "url('loader.gif')",
    	"background-position": "center",
    	"background-repeat": "no-repeat",
    	"background-size": "contain"
    };
    
# Adding magicast(s) to the web page #

Now the environment should be ready for including the actual Magicast components to the page. There are four ways to do that:

1. Define Magicast using Mahti path definition (= the normal way)
2. Define Magicast using Mahti magicastId (= shortcut)
3. Define Magicast using URI to XML file (= local version)
4. Define Magicast using JSON object (= dynamic version)

See the example ??? for reference about different include methods.

## Mahti path definition ##

To use this method there must exist a path declaration in Mahti. This is the way to restrict the access to certain Magicasts.

	<body data-magicast-path-name="pathName">
		<div data-magicast-path-data="magicast" id="a" style="height:480px;width:640px"></div>
	</body>

This method creates a session to the server, to receive Magicast data and update status information.

## Mahti magicastId definition ##

The shortcut compared to the path defitinion is to use direct magicast id from Mahti Admin.

    <div data-magicast-id="707" id="b" style="height:480px;width:640px"></div>

This method creates a session to the server, to receive Magicast data and update status information.

## URI to XML file ##

Direct URI pointing to XML file can be used also as a source for magicast data. Note that when using this method no backend sessions are automatically created. This also means that access control and features depending on that are not supported.

    <div data-magicast-xml="/gug/examples/example5/variable.xml" id="c" style="height:480px;width:640px"></div>

This method does not create an online session to backend.

Note that if you want to reference to XML file in other domain, you need to support cross-origin requests for the operation.

## JSON object ##

JSON object can be directly included in the HTML file. There are two alternatives, either putting data to the data-attribute or then including the data in the DIV contents.

	<div data-magicast-json=" {
    	"magicast": {
			"name": "sivucast",
			"debug": "false",
			"node": ...
			
			... JSON data ...
		}
	}" id="d" style="height:480px;width:640px"></div> 
	
Or

	<div data-magicast-json id="d" style="height:480px;width:640px" >
		{
    	"magicast": {
			"name": "sivucast",
			"debug": "false",
			"node": ...
			
			... JSON data ...
		}
	</div>

The difference from the end user point of view is that in the second way the DIV contents (JSON data) can be seen for a short while in the page, while in the 1st option the JSON data is completely invisible. 
