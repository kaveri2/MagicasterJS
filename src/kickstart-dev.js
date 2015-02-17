/**
 * @preserve Copyright (c) 2013 Yleisradio (YLE)
 * (http://www.yle.fi) and MagicasterJS Contributors (1)
 *
 * (1) MagicasterJS Contributors are listed in the AUTHORS file.
 *     Please extend this file, not this notice.
 *
 * @license Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * All rights reserved
 * Please contact us for an alternative licence
 */


(function () {
    "use strict";

	var gaAccount = 'UA-58687807-1';
	window._gaq = window._gaq || [];
	_gaq.push(['_setAccount', gaAccount], ['_setDomainName', 'none'], ['_trackPageview']);

	(function() {
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	})();	
	
    //
    // LOCAL DEFINITIONS
    //

    var loadQueue = [];
    var scripts = document.getElementsByTagName('script');
    var path = scripts[scripts.length - 1].src.split('?')[0];      // remove any ?query
    var basePath = path.split('/').slice(0, -1).join('/') + "/";  // remove last filename part of path

    // RequireJS
    var mainJs = basePath + "/libs/require.js";

    // Version (from current timestamp for development purposes)
    var version = Date.now();

    // RequireJS configuration definition
    var requireConfig = {
        baseUrl: basePath,
        urlArgs: "v=" + version,
        paths: {
            'jquery': "libs/jquery-2.0.3",
            'jquery.easing': "libs/jquery.easing.1.3",
            'lodash': "libs/lodash",
            'extend': "libs/extend",
            'verge': "libs/verge",
            'html2canvas': "libs/html2canvas",
            'pixi': "libs/pixi.dev",
            'binaryajax': "libs/binaryajax",
            'exif': "libs/exif",
            'fpsmeter': "libs/fpsmeter",
			'webfont': "libs/webfont"
        },
        shim: {
			'jquery.easing': ['jquery'],
            'extend': {
                exports: 'BaseClass'
            },
            'verge': {
                exports: 'verge'
            },
            'html2canvas': {
                exports: 'html2canvas'
            },
            'pixi': {
                exports: 'pixi'
            },
            'binaryajax': {
                exports: 'Asd',
                init: function () {
                    return {
                        BinaryFile: this.BinaryFile,
                        BinaryAjax: this.BinaryAjax
                    };
                }
            },
            'exif': {
                exports: 'EXIF'
            },
            'fpsmeter': {
                exports: "FPSMeter"
            },
			'webfont': {
				exports: 'WebFont'
			}
		}
    };
	
    // MagicasterJS configuration definition
	var config = {
		debug: true,
		clientName: "http://themightybullsitconsulting.com/magicaster/",
		server: {
			uri: "http://themightybullsitconsulting.com/magicaster/server/",
			bufferTime: 0.2
		},
		assetResolvers: {
			ext: function(value) {
				return "http://themightybullsitconsulting.com/magicaster/client/ext/" + value + "?=" + version;
			},
			component: function(value) {
				return "components/" + parseComponentName(value);
			},
			source: function(value) {
				return basePath + value + "?=" + version;
			}
		},
		/*
		statusHandler: {
			show: function(magicast, element, type, parameters) {
				var $ = Magicaster.$; // get jQuery
				var message = $('<div><b>' + type + ':</b>' + ' ' + parameters + '</div>');
				$(element).prepend(message);
				$(element).css({
					'background-color': 'gray'
				});
				$(element).show();
			},
			hide: function(magicast, element, type, callback) {
				var $ = Magicaster.$; // get jQuery
				if (type === 'changingNode') {
					$(element).hide(1000, function() {
						callback();
					});
				}
				else {
					callback();
				}
			}
		},
		*/
		analytics: {
			send: function(magicast, event, label, value) {
				_gaq.push(['_setAccount', gaAccount], ['_setDomainName', 'none'], ['_trackEvent', "magicast_" + (0 + magicast.id) + "_" + magicast.name, event, label, value]);
			}
		}
	};
	
    //
    // LOCAL FUNCTIONS
    //
	
	var console = config.debug ? window.console : { log: function() {} };

	function parseComponentName(fullName) {
		if (fullName && fullName.indexOf('/') >= 0 && fullName.indexOf('.') > 0) {
			// This assumes we are having at least one '/' -character and '.' -character
			var path = fullName.split('/');
			var fileName = path.pop().split('.')[0];
			path = path.join('/');
			return  path + '/' + fileName;
		}
		else {
			if (fullName && fullName.indexOf('/') === -1 && fullName.indexOf('.') > 0) {
				return fullName.split('.')[0];
			}
			else if (fullName && fullName.indexOf('/') === -1 && fullName.indexOf('.') === -1) {
				return fullName;
			}
			else {
				return null;
			}
		}
	}
	
	// identical logic to Magicaster.loadJs
	function loadJs(uri, callback) {
		var script = document.createElement("script");
		script.type = "text/javascript";
		if (callback) {
			if (script.readyState) {  //IE
				script.onreadystatechange = function () {
					if (script.readyState === "loaded" ||
						script.readyState === "complete") {
						script.onreadystatechange = null;
						callback();
					}
				};
			} else {  //Others
				script.onload = function () {
					callback();
				};
			}
		}
		script.setAttribute("src", uri + "?v=" + version);
		document.getElementsByTagName("head")[0].appendChild(script);
	}

	// identical logic to Utils.dispatchEvent
	function dispatchEvent(eventName, params, element) {
		console.log("[kickstart] dispatchEvent", eventName, params, element);
		var event;
		var targetElem = element || document;
		if (document.createEvent) {
			event = document.createEvent("HTMLEvents");
			event.initEvent(eventName, true, true);
		} else {
			event = document.createEventObject();
			event.eventType = eventName;
		}


		if (params) {
			for (var key in params) {
				if (key) {
					event[key] = params[key];
				}
			}
		}

		if (document.createEvent) {
			targetElem.dispatchEvent(event);
		}
		else if (document.createEventObject) {
			targetElem.fireEvent("on" + event.eventType, event);
		}
		if (typeof targetElem["on" + eventName] === "function") {
			targetElem["on" + eventName](event);
		}
	}

    //
    // EXECUTION
    //

    console.log("[kickstart] start");

	/**
	 * Kickstart initialized
	 * @event
	 * @name magicaster_kickstartInitialized
	 */
	dispatchEvent("magicaster_kickstartInitialized");

	loadJs(mainJs, function() {
	
		/**
		 * Kickstart loaded
		 * @event
		 * @name magicaster_kickstartLoaded
		 */
		dispatchEvent("magicaster_kickstartLoaded");

		require.config(requireConfig);

		require.onError = function(err) {
			console.log("[kickstart] require.onError", err);
			/**
			 * Fatal error
			 * @event
			 * @name magicaster_fatalError
			 */
			dispatchEvent("magicaster_fatalError", {requireError: err});
		};

		require(["core/magicaster"], function (Magicaster) {
			// Wait for DOM to be ready
			Magicaster.$(function() {
				window.Magicaster = Magicaster;
				window.Magicaster.start(config);
			});
		});
		
	});
		
    console.log("[kickstart] end");
	
})();
