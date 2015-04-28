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

define(["jquery",
        "utils/xmlparser",
        "core/debugger",
        "core/server",
        "core/capabilities",
        "utils/keyevents",
        "extend",
        "lodash",
        "utils/utils",
        "fpsmeter"],
    function ($, XmlParser, Debugger, Server, Capabilities, KeyEvents, BaseClass, _, Utils, FPSMeter) {
        "use strict";

        (function () {
            var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
            window.requestAnimationFrame = requestAnimationFrame;
        })();

        /**
         * Magicaster object for holding global methods.
         * @namespace Magicaster
         */
        var Magicaster = (function () {
            /** @lends Magicaster **/

            //
            // LOCAL DEFINITIONS
            //

            var self = this;

            var objectIndex = 0; // global index for resolving unique identifier for different objects

            /**Array containing all magicasts on page.
             * @name Magicaster.magicasts
             * @type {Array<Object>}
             * @public
             */
            var magicasts = [];
            var console = {};
			/**Server connection object (Singleton). See linked doc below for server API methods.
			 * @name Magicaster.server
			 * @type {Object}
			 * @see Server
			 * @public
			 */
			var server = Server;

            var resolvePromises = [];
            var initializePromises = [];
            var startPromises = [];

            var globalVariables = {}; // global variables

            var fpsMeter = null;

            var path = {
                name: "",
                data: null
            };

            var configuration = {
                debug: true,
                clientName: "",
                server: {
                    "uri": "",
                    bufferTime: 100
                },
                valueResolvers: {
                    "url": function (value) {
                        return value;
                    }
                },
				analytics: {
				}
            };

            var cdGroups = {};

            //
            // LOCAL FUNCTIONS
            //

            /**
             * Requests page's Magicaster path change from the server
             * @public
             * @method
             * @name Magicaster#changePath
             * @param name {String} Path name
             * @returns {promise}
             */
            function changePath(name) {
                path.name = name;
                path.data = null;
                return Magicaster.server.callMethod("Path.search", { 'name': path.name })
                    .done(function (data) {
                        path.data = data.data;
                        path.id = $.trim(data.id);
						/**
						 * Page's Magicaster path has changed
						 * @event
						 * @name magicaster_pathChanged
						 * @param path {Object<path>} new path
						 */
                        Utils.dispatchEvent("magicaster_pathChanged", {path: path});
                    })
                    .fail(function (error) {
                        // TODO: error handling
                        path.data = null;
                        Utils.dispatchEvent("magicaster_pathChanged", {path: path});
                    });
            }

            /**
             * Removes a layer from all collision detection groups it belongs to
             * @public
             * @method
             * @name Magicaster#removeFromCd
             * @param layer {Layer} Layer to remove from collision detection
             */
            function removeFromCd(layer) {
                _(cdGroups).each(function (cdGroup) {
                    delete cdGroup.sources[layer.index];
                    delete cdGroup.targets[layer.index];
                });
            }

            /**
             * Apply layer's collision detection group data
             * @public
             * @method
             * @name Magicaster#applyCdGroup
             * @param data {Object} collision detection group data
             * @param layer {Layer} layer
             */
            function applyCdGroup(magicast, layer, global, name, source, target) {
                var name = (global ? "global_" : "local_" + magicast.getObject().index + "_") + name;
                if (!cdGroups[name]) {
                    cdGroups[name] = {
                        sources: {},
                        targets: {}
                    };
                }
                if (source) {
                    cdGroups[name].sources[layer.index] = {
                        layer: layer,
                        element: layer.getContainer()[0],
                        oldState: false
                    };
                }
                else {
                    delete cdGroups[name].sources[layer.index];
                }
                if (target) {
                    cdGroups[name].targets[layer.index] = {
                        layer: layer,
                        element: layer.getContainer()[0],
                        oldState: false
                    };
                }
                else {
                    delete cdGroups[name].targets[layer.index];
                }
            }
			
			var lastTimeStamp = 0;

//            function animationFrame(timeStamp) {
            function animationFrame() {
			
				var timeStamp = new Date().getTime();			
				var time = lastTimeStamp ? (timeStamp - lastTimeStamp) / 1000 : 0;
				lastTimeStamp = timeStamp;
			
                if (fpsMeter) {
                    fpsMeter.tickStart();
                }

                // tick magicasts
                _.each(magicasts, function (magicast) {
                    magicast.tick(time);
                });

                // collision detection
                _(cdGroups).each(function (cdGroup) {
                    // Don't trigger events from targets - makes the processing a bit faster
                    /*
                     _(cdGroup.targets).each(function (target) {
                     target.newState = false;
                     });
                     */
                    _(cdGroup.sources).each(function (source) {
                        source.newState = false;
                        _(cdGroup.targets).find(function (target) {
                            if (source.element !== target.element && Utils.checkForCollision(source.element, target.element)) {
                                source.newState = true;
                                target.newState = true;
                                return true;
                            }
                            return false;
                        });
                    });
                    /*
                     _(cdGroup.targets).each(function (target) {
                     if (target.oldState != target.newState) {
                     if (target.newState) {
                     target.layer.resolveAndTriggerEvent(target.data.collisionStartEvent);
                     } else {
                     target.layer.resolveAndTriggerEvent(target.data.collisionEndEvent);
                     }
                     target.oldState = target.newState;
                     }
                     });
                     */
                    _(cdGroup.sources).each(function (source) {
                        if (source.oldState !== source.newState) {
                            var args = {
                                global: source.data.global,
                                name: source.data.name
                            };
                            if (source.newState) {
                                source.layer.triggerEvent("collisionStart", args);
                                source.layer.triggerEvent("collisionStart_" + name, args);
                            } else {
                                source.layer.triggerEvent("collisionEnd", args);
                                source.layer.triggerEvent("collisionEnd_" + name, args);
                            }
                            source.oldState = source.newState;
                        }
                    });
                });

                if (fpsMeter) {
                    fpsMeter.tick();
                }
				
				setTimeout(animationFrame, 0);
//                window.requestAnimationFrame(animationFrame);
            }

            function enable_hobbytv_functionality() {
                function initApp() {
                    try {
                        var app = document.getElementById('appmgr').getOwnerApplication(document);
                        app.show();
                        app.activate();
                    } catch (e) {
                        // ignore
                    }
                    setKeyset(0x1 + 0x2 + 0x4 + 0x8 + 0x10);
                }

                function setKeyset(mask) {
                    var elemcfg;
                    // for HbbTV 0.5:
                    try {
                        elemcfg = document.getElementById('oipfcfg');
                        elemcfg.keyset.value = mask;
                    } catch (e) {
                        // ignore
                    }
                    try {
                        elemcfg = document.getElementById('oipfcfg');
                        elemcfg.keyset.setValue(mask);
                    } catch (e) {
                        // ignore
                    }
                    // for HbbTV 1.0:
                    try {
                        var app = document.getElementById('appmgr').getOwnerApplication(document);
                        app.privateData.keyset.setValue(mask);
                        app.privateData.keyset.value = mask;
                    } catch (e) {
                        // ignore
                    }
                }

                var appmgr = $('<object id="appmgr" type="application/oipfApplicationManager" style="position: absolute; left: 0px; top: 0px; width: 0px; height: 0px;"></object><object id="oipfcfg" type="application/oipfConfiguration" style="position: absolute; left: 0px; top: 0px; width: 0px; height: 0px;"></object>');
                $("body").append(appmgr);
                initApp();
            }

            function createMagicast(data, container) {
                var d = $.Deferred();
                require(["core/magicast"], function (Magicast) {
                    var magicast = new Magicast(data, container);
                    magicasts.push(magicast);
                    magicast.getInitializePromise().always(function () {
                        d.resolve();
                    });
                });
                return d.promise();
            }

            function setupConsole() {
                if (!configuration.debug) {
                    Magicaster.console.log = $.noop;
                    Magicaster.console.error = $.noop;
                }
                else {
                    Magicaster.console.log = Debugger.log;
                    Magicaster.console.error = Debugger.error;
                }
            }

            function findMagicastsByName(name) {
                return _.where(magicasts, {name: Utils.validateName(name, 'Magicast')});
            }

            function showStatus(magicast, container, type, params) {
                if (Magicaster.configuration.statusHandler) {
                    Magicaster.configuration.statusHandler.show(magicast, $(container).find('.magicaster-magicast-status-display')[0], type, params);
                }
            }

            function hideStatus(magicast, container, type) {
                var d = $.Deferred();
                if (Magicaster.configuration.statusHandler) {
                    Magicaster.configuration.statusHandler.hide(magicast, $(container).find('.magicaster-magicast-status-display')[0], type, function () {
                        d.resolve();
                    });
                }
                else {
                    d.resolve();
                }
                return d.promise();
            }

            /**
             * Processes page for Magicasts
             * @public
             * @method
             * @name Magicaster#process
             * @returns {promise}
             */
            function process() {

                var startDeferred = $.Deferred();

                // Find relevant Magicast containers from the page and
                // instantiate the required objects.

                var containers = [];
                var pathContainers = [];
                var idContainers = [];
                var XMLContainers = [];
                var JSONContainers = [];

                // Magicast objects can be created from 4 Magicast container types, which are defined by different data attributes:
                // 1. data-magicaster-magicast-path-query - Magicast's id and check are queried from path data
                // 2. data-magicaster-magicast-id - Magicast is created from the server according to the id
                // 3. data-magicaster-magicast-xml - Magicast is created directly from given XML (embedded or URI)
                // 4. data-magicaster-magicast-json - Magicast is created directly from given XML (embedded or URI)

                // Select unprocessed Magicast containers in the page.
                pathContainers = $.makeArray($("[data-magicaster-magicast-path-query]:not(.magicaster-magicast-resolved)"));
                idContainers = $.makeArray($("[data-magicaster-magicast-id]:not(.magicaster-magicast-resolved)"));
                XMLContainers = $.makeArray($("[data-magicaster-magicast-xml]:not(.magicaster-magicast-resolved)"));
                JSONContainers = $.makeArray($("[data-magicaster-magicast-json]:not(.magicaster-magicast-resolved)"));

                // Combine the Magicast containers
                containers = _.union(pathContainers, idContainers, XMLContainers, JSONContainers);

                // Create container's DIV structure
                _(containers).each(function (container) {

                    // Unresolved containers may already have the structure
                    if ($(container).find('.magicaster-magicast').length === 0) {

                        var $magicast = $("<div></div>")
                            .css({
                                width: '100%',
                                height: '100%'
                            })
                            .addClass("magicaster-magicast");

                        $(container).append($magicast);

                        var $stage = $("<div></div>")
                            .css({
                                height: '100%',
                                width: '100%',
                                position: "relative",
                                "box-sizing": "border-box",
                                opacity: 1
                            })
                            .addClass("magicaster-magicast-stage");

                        $magicast.append($stage);

                        var $viewport = $("<div></div>")
                            .css({
                                height: '100%',
                                width: '100%',
                                position: "absolute",
                                "box-sizing": "border-box",
                                opacity: 1
                            })
                            .addClass("magicaster-magicast-viewport");

                        $stage.append($viewport);

                        if (Magicaster.configuration.statusHandler) {
                            var $statusdisplay = $('<div></div>')
                                .css({
                                    'width': '100%',
                                    'height': '100%',
                                    'position': 'relative'
                                })
                                .addClass('magicaster-magicast-status-display');

                            $stage.append($statusdisplay);
                        }

                        showStatus(null, container, 'creating');
                    }
                });

                function resolvePathContainers() {
					if (path.data) {
						_(pathContainers).each(function (container) {
							var el = $(container);
							var data = path.data[el.data('magicaster-path-query')];
							if (data) {
								el.addClass("magicaster-magicast-resolved");
								initializePromises.push(createMagicast(data, container));
							}
						});
					}
                }

                if ($('body').data('magicaster-path-name')) {
                    var pathName = $('body').data('magicaster-path-name');
                    if (pathName !== path.name) {
                        var pathDeferred = $.Deferred();
                        var pathPromise = pathDeferred.promise();
                        changePath(pathName)
							.done(function () {
								resolvePathContainers();
								pathDeferred.resolve();
							})
							.fail(function() {
								// TODO, handle !!!
								pathDeferred.resolve();
							});
                        resolvePromises.push(pathPromise);
                    } else {
                        resolvePathContainers();
                    }
                }

                _(idContainers).each(function (container) {
                    var el = $(container);
                    el.addClass("magicaster-magicast-resolved");
                    var id = el.data("magicaster-magicast-id");
                    var check = el.data("magicaster-magicast-check");
                    initializePromises.push(createMagicast({'id': id, 'check': check}, container));
                });

                _(JSONContainers).each(function (container) {
                    var el = $(container);
                    el.addClass("magicaster-magicast-resolved");
                    var data = el.data("magicaster-magicast-json");
                    // JSON embedded
                    if (!data) {
                        var val = el.find("textarea").val();
                        if (val) {
                            data = JSON.parse(val);
                        }
                        el.find("textarea").remove();
                        Magicaster.console.log("[Magicaster] JSON from textarea", data);
                        initializePromises.push(createMagicast(data, container));
                    }
                    // load JSON file
                    else {
                        var d = $.Deferred();
                        d.resolve();
                        // TODO: load JSON
                        initializePromises.push(d.promise());
                    }
                });

                _(XMLContainers).each(function (container) {
                    var el = $(container);
                    el.addClass("magicaster-magicast-resolved");
                    var data = el.data("magicaster-magicast-xml");
                    // XML embedded
                    if (!data) {
                        var val = el.find("textarea").val();
                        if (val) {
                            data = XmlParser.parseXmlData(val);
                        }
                        el.find("textarea").remove();
                        Magicaster.console.log("[Magicaster] XML from textarea", data);
                        initializePromises.push(createMagicast(data, container));
                    }
                    // load XML file
                    else {
                        var d = $.Deferred();
                        XmlParser.parseAsync(data)
                            .done(function (data) {
                                Magicaster.console.log("[Magicaster] XML from file", data);
                                createMagicast({'data': data}, container).done(function () {
                                    d.resolve();
                                });
                            })
                            .fail(function () {
                                showStatus(null, container, 'createError');
                                d.resolve();
                            });
                        initializePromises.push(d.promise());
                    }
                });

                $.when.apply(window, resolvePromises).then(function () {
                    /**
                     * Magicasts have been resolved from the page
                     * @event
                     * @name magicaster_allMagicastsResolved
                     * @param containers {Array<element>} Array of Magicast containers
                     */
                    Utils.dispatchEvent("magicaster_allMagicastsResolved", {"containers": $.makeArray($(".magicaster-magicast-resolved"))});
					
					$.when.apply(window, initializePromises).then(function () {

						/** Magicasts have been initialized
						 * @event
						 * @name magicaster_allMagicastsInitialized
                         * @param containers {Array<element>} Array of Magicast containers
						 */
						Utils.dispatchEvent("magicaster_allMagicastsInitialized", {"containers": $.makeArray($(".magicaster-magicast-resolved"))});

						_.each(magicasts, function (magicast) {
							startPromises.push(magicast.getStartPromise());
						});

						$.when.apply(window, startPromises).then(function () {
							/** AMagicasts have been started
							 * @event
							 * @name magicaster_allMagicastsStarted
                             * @param containers {Array<element>} Array of Magicast containers
							 */
							Utils.dispatchEvent("magicaster_allMagicastsStarted", {"containers": $.makeArray($(".magicaster-magicast-resolved"))});

							startDeferred.resolve();
						});
						
					});
					
                });

                return startDeferred.promise();
            }

            function setupGlobalEvents() {

                var scrollTop = 0;
                var scrollLeft = 0;
                var verticalScrollDirection = "none";
                var horizontalScrollDirection = "none";

                function calculateScroll() {
                    var newScrollTop = $(window).scrollTop();
                    var scrollableHeight = $(document).height() - $(window).height();
                    var relScrollTop = newScrollTop / scrollableHeight * 100;
                    var newScrollBottom = newScrollTop + $(window).height();
                    var relScrollBottom = newScrollBottom / $(document).height() * 100;
                    verticalScrollDirection = (newScrollTop > scrollTop ? "down" : (newScrollTop === scrollTop ? "none" : "up"));

                    var newScrollLeft = $(window).scrollLeft();
                    var scrollableWidth = $(document).width() - $(window).width();
                    var relScrollLeft = newScrollLeft / scrollableWidth * 100;
                    var newScrollRight = newScrollLeft + $(window).width();
                    var relScrollRight = newScrollRight / $(document).width() * 100;
                    horizontalScrollDirection = (newScrollLeft > scrollLeft ? "right" : (newScrollLeft === scrollLeft ? "none" : "left"));

                    globalVariables["absScrollTop"] = newScrollTop;
                    globalVariables["relScrollTop"] = relScrollTop;
                    globalVariables["absScrollBottom"] = newScrollBottom;
                    globalVariables["relScrollBottom"] = relScrollBottom;
                    globalVariables["absScrollLeft"] = newScrollLeft;
                    globalVariables["relScrollLeft"] = relScrollLeft;
                    globalVariables["absScrollRight"] = newScrollRight;
                    globalVariables["relScrollRight"] = relScrollRight;

                    scrollTop = newScrollTop;
                    scrollLeft = newScrollLeft;
                }

                $(window).on("scroll", function () {
                    calculateScroll();
                    triggerGlobalEvent("scroll", {
                        "absScrollTop": globalVariables["absScrollTop"],
                        "relScrollTop": globalVariables["relScrollTop"],
                        "absScrollBottom": globalVariables["absScrollBottom"],
                        "relScrollBottom": globalVariables["relScrollBottom"],
                        "absScrollLeft": globalVariables["absScrollLeft"],
                        "relScrollLeft": globalVariables["relScrollLeft"],
                        "absScrollRight": globalVariables["absScrollRight"],
                        "relScrollRight": globalVariables["relScrollRight"],
                        "verticalDirection": verticalScrollDirection,
                        "horizontalDirection": horizontalScrollDirection
                    });
                });
				
				var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
				
				$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(e) {
					var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
					
					triggerGlobalEvent("fullscreen_change");
					if (fullscreenElement) {
						globalVariables["fullscreen"] = 1;
						triggerGlobalEvent("fullscreen_enter");
					} else {
						globalVariables["fullscreen"] = 0;
						triggerGlobalEvent("fullscreen_exit");
					}
					
					_.each(magicasts, function (magicast) {
						if (fullscreenElement==magicast.$root.get(0)) {
							magicast.setVariable("fullscreen", 1);
							magicast.triggerEvent("fullscreen_change");
							triggerGlobalEvent("fullscreen_enter");
						} else if (magicast.getVariable("fullscreen")==1) {
							magicast.setVariable("fullscreen", false);
							magicast.triggerEvent("fullscreen_change");
							triggerGlobalEvent("fullscreen_exit");
						}
					});

				});
				
                $(window).on("resize", function () {
                    //relative scroll positions change when resizing so they have to be recalculated
                    calculateScroll();
                    triggerGlobalEvent("resize");
                });
            }

            /**
             * Starts Magicast (NOTE! Should only be called by kickstart)
             * @public
             * @method
             * @name Magicaster#start
             * @param configuration {Object} Magicast configuration options
             * @param configuration.debug {Boolean} Enables/disables debug logging
             * @param configuration.clientName {String} Defines the client's name for server
             * @param configuration.assetResolvers {Object} Object containing assets mapped to their respective resolver functions
             * (See kickstart.js or kickstart-dev.js for reference)
             * @param configuration.server {Object} Object containing server configuration
             * (See server.js for reference)
             */
            function start(_configuration) {

                function recursiveExtend(target, source) {
                    for (var prop in source)  {
                        if (target[prop] && typeof target[prop] === 'object') {
                            recursiveExtend(target[prop], source[prop]);
                        }
                        else {
                            target[prop] = source[prop];
                        }
                    }

                    return target;
                }

                // Extend defaults if given
                recursiveExtend(configuration, _configuration);

                // Setup console 1st
                setupConsole();

                Magicaster.console.log("[Magicaster] configuration", configuration);
                Magicaster.console.log("[Magicaster] jQuery", $.fn.jquery);

                setupGlobalEvents();

                // Detect the capabilities of the running platform
                Capabilities.detectCapabilities();
				_(Capabilities.getCapabilities()).each(function(value, key) {
					globalVariables["capability_" + key] = 0 + value;
				});
			
                // Bind keyboard events
                KeyEvents.bindKeyboardEvents();

				// Set clientName				
                if (configuration.clientName) {
                    Magicaster.server.callMethodDelayed("Client.set", { 'name': configuration.clientName })
                        .done(function (data) {
						})
                        .fail(function (error) {
							// TODO !!!
						});
                }
								
                // Process document
                var startPromise = process();
				startPromise.done(function () {
					animationFrame();
//                    window.requestAnimationFrame(animationFrame);
                });
				
                // send the first request immediately, because it creates the sessionKey
                Magicaster.server.sendRequest();

				return startPromise;
            }

            function loadJs(asset, callback) {
                var uri = Magicaster.resolveAndGetValue(asset);
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
                script.setAttribute("src", uri);
                document.getElementsByTagName("head")[0].appendChild(script);
            }

            function loadCss(asset) {
                var uri = Magicaster.resolveAndGetValue(asset);
                var i = -1;
                var sheets = document.getElementsByTagName("link");
                var sheetLength = sheets.length;
                var found = false;
                var re = new RegExp(uri);
                while (++i < sheetLength) {
                    if (re.test(sheets[i].href)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    var el = document.createElement("link");
                    el.setAttribute("rel", 'stylesheet');
                    el.setAttribute("href", uri);
                    document.getElementsByTagName("head")[0].appendChild(el);
                }
            }

			function parseSourceName(fullName) {
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
			
            function resolveAndGetValue(magicast, layer, params, eventArgs) {
//				Magicaster.console.log("[Magicaster] resolveAndGetValue", magicast, layer, params, eventArgs);
				
				if (params instanceof Object === true) {
				
					var type = $.trim(params.type);
					var value = params.value;
				
                    if (type == "constant") {
                        return $.trim(value);
                    }
                    if (type == "source") {
                        return parseSourceName($.trim(value));
                    }
                    if (type == "eventArgument") {
                        return eventArgs ? eventArgs[$.trim(value)] : null;
                    }
                    if (type == "variable") {
						// global level
						if (Magicaster.resolveAndGetValue(magicast, layer, value.level, eventArgs) == "global") {
							return globalVariables[Magicaster.resolveAndGetValue(magicast, layer, value.name, eventArgs)];
						}
						// local level
						var magicast = value.magicast ? Magicaster.findMagicastsByName(Magicaster.resolveAndGetValue(magicast, layer, value.magicast, eventArgs))[0] : magicast;
						if (magicast) {
							return magicast.getVariable(Magicaster.resolveAndGetValue(magicast, layer, value.name, eventArgs));
						}
						return null;
                    }
                    if (type == "property") {
						var magicast = value.magicast ? Magicaster.findMagicastsByName(Magicaster.resolveAndGetValue(magicast, layer, value.magicast, eventArgs))[0] : magicast;
						// magicast level
						if (Magicaster.resolveAndGetValue(magicast, layer, value.level, eventArgs) == "magicast" || (!layer && !value.layer)) {
							return magicast.getProperties()[Magicaster.resolveAndGetValue(magicast, layer, value.name, eventArgs)];
						}
						// layer level
						if (value.layer) {
							layer = magicast.findLayerByName(Magicaster.resolveAndGetValue(magicast, layer, value.layer, eventArgs));
						}
						if (layer) {
							var name = Magicaster.resolveAndGetValue(magicast, layer, value.name, eventArgs);
							// Supports calcs 1st and properties 2nd
							return layer.getCalculations()[name] || layer.getProperties()[name];
						}
						return null;
                    }
                    if (type == "calculation") {
					
						var args = [];
						_(Utils.convertToArray(value, "argument")).each(function (value) {
							args.push(Magicaster.resolveAndGetValue(magicast, layer, value, eventArgs));
						});
						
						var val = undefined;
						var cmp, num;
						
						switch (Magicaster.resolveAndGetValue(magicast, layer, value["function"], eventArgs)) {
						// NUMBER
						case 'add':
							val = 0;
							_(args).each(function(arg) {
								num = parseFloat(arg) || 0;
								val = val + num;
							});
							break;
						case 'dec':
							value = (parseFloat(args[0]) || 0) - (parseFloat(args[1]) || 0);
							break;
						case 'mul':
							val = 1;
							_(args).each(function(arg) {
								num = parseFloat(arg) || 0;
								val = val * num;
							});
							break;
						case 'div':
							if (!arg2) {
								throw new RangeError("Division by zero.");
							}
							val = (parseFloat(args[0]) || 0) / (parseFloat(args[1]) || 0);
							break;
						// BOOLEAN
						case 'and':
							val = 1;
							_(args).each(function(arg) {
								if (!arg) {
									val = 0;
								}
							});
							break;
						case 'or':
							val = 0;
							_(args).each(function(arg) {
								if (arg) {
									val = 1;
								}
							});
							break;
						case 'not':
							val = args[0] ? 0 : 1;
							break;
						case 'eq':
							val = 1;
							cmp = "" + args[0];
							_(args).each(function(arg) {
								if ("" + arg != cmp) {
									val = 0;
								}
							});
							break;
						case 'ne':
							val = 1;
							cmp = "" + args[0];
							_(args).each(function(arg) {
								if ("" + arg == cmp) {
									val = 0;
								}
							});
							break;
						case 'gt':
							val = 1;
							cmp = parseFloat(args[0]);
							_(args).each(function(arg) {
								if (arg != args[0]) {
									num = parseFloat(arg);
									if (num >= cmp) {
										val = 0;
									}
									cmp = num;
								}
							});
							break;
						case 'lt':
							val = 1;
							cmp = parseFloat(args[0]);
							_(args).each(function(arg) {
								if (arg != args[0]) {
									num = parseFloat(arg);
									if (num <= cmp) {
										val = 0;
									}
									cmp = num;
								}
							});
							break;
						case 'isNull':
							val = args[0] ? 0 : 1;
							break;
						case 'isNotNull':
							val = args[0] ? 1 : 0;
							break;		
						// STRING
						case 'concat':
							val = args.join("");
							break;
						// MISC
						case 'rand':
							val = _.random(arg1Num, arg2Num);
							break;
						default:
							break;
						}
						
						return val;						
                    }
                    if (type == "conditional") {
                        var cases = Utils.convertToArray(value, "case");
						var retVal = undefined;
                        _.each(cases, function(c) {
							if (retVal === undefined && Magicaster.resolveAndGetValue(magicast, layer, c.condition, eventArgs)) {
								retVal = Magicaster.resolveAndGetValue(magicast, layer, c.value, eventArgs);
							}
						});
						return retVal;
                    }
                    if (type == "random") {
                        var options = Utils.convertToArray(value, "option");
                        var totalWeight = 0;
                        options.forEach(function (option) {
							option.weightFloat = Magicaster.resolveAndGetValue(magicast, layer, option.weight, eventArgs);
                            totalWeight = totalWeight + parseFloat(option.weightFloat);
                        });
                        var randomWeight = Math.random() * totalWeight;
                        var weight = 0;
                        var index = -1;
                        while (weight < randomWeight) {
                            index = index + 1;
                            weight = weight + options[index].weightFloat;
                        }
                        if (index > -1) {
                            return Magicaster.resolveAndGetValue(magicast, layer, options[index].value, eventArgs);
                        }
                    }
					
					var resolver = configuration.valueResolvers[type];
					if (resolver) {
						return resolver(value);
					}
					
                }				
				
                return $.trim(params);
            }

            /**
             * Triggers Magicast event
             * @public
             * @method
             * @name Magicaster#triggerEvent
             * @param magicast {String} Target Magicast's name
             * @param layer {String} Target layer's name
             * @param name {String} Event name
             * @param args {Object} Event arguments
             */
            function triggerEvent(magicast, layer, name, args) {
                args = args || {};
                var properties;
                var target;
				
				if (magicast) {
				
					if (layer) {
						properties = {
							'magicast': magicast,
							'layer': layer,
							'name': name,
							'args': args
						};
						target = layer.getContainer()[0];
					}
					else {
						properties = {
							'magicast': magicast,
							'name': name,
							'args': args
						};
						target = magicast.$root[0];
					}				
				
					/**
					 * Raised when Magicaster event occurs. Global level event is dispatched to document.
					 * Magicast level event is dispatched to Magicast container. Layer level event is dispatched to layer container.
					 * Magicast and layer level events can also be listened from document due to bubbling.
					 *
					 * Example of real fired event name is e.g. "magicaster_event_someEventName".
					 *
					 * @event
					 * @name magicaster_event_[eventName]
					 * @param magicast {Object} Reference to Magicast instance
					 * @param layer {String} Layer name if event is for layer. Otherwise layer is not defined.
					 * @param name {String} Event name
					 * @param args {String} Event arguments
					 */
					Utils.dispatchEvent('magicaster_event_' + name, properties, target);

					/**
					 * Raised when Magicaster event occurs. Event is dispatched to either target Magicast or to target layer,
					 * but events can be listened from document due to bubbling.
					 *
					 * @event
					 * @name magicaster_event
					 * @param magicast {Object} Reference to Object instance
					 * @param layer {String} Layer name if event is for layer. Otherwise layer is not defined.
					 * @param name {String} Event name
					 * @param args {String} Event arguments
					 */
					Utils.dispatchEvent('magicaster_event', properties, target);
				
				}
				else {
				
					properties = {
						'name': name,
						'args': args
					};
					target = document;
					
					Utils.dispatchEvent('magicaster_global_event_' + name, properties, target);
					Utils.dispatchEvent('magicaster_global_event_', properties, target);
			
				}

            }

            /**
             * Triggers global Magicast event.
             * @public
             * @method
             * @name Magicaster#triggerGlobalEvent
             * @param name {string} Event name
             * @param args {Object} Event arguments
             */
            function triggerGlobalEvent(name, args) {
				return triggerEvent(null, null, name, args);
            }

            function resolveAndTriggerEvent(magicast, layer, params, eventArgs) {

                Magicaster.console.log("[Magicaster] resolveAndTriggerEvent", magicast, layer, params, eventArgs);

                if (params instanceof Object === false) {
                    params = { "name": params };
                }

                // resolve arguments
                var args = {};
                Utils.convertToArray(params, "argument").forEach(function (arg) {
                    args[Magicaster.resolveAndGetValue(magicast, layer, arg.name, eventArgs)] = Magicaster.resolveAndGetValue(magicast, layer, arg.value, eventArgs);
                });

				var delay = params.delay ? parseFloat(Magicaster.resolveAndGetValue(magicast, layer, params.delay, eventArgs)) * 1000 || 0 : 0;
				if (delay > 0) {
					setTimeout(function () {
						run();
					}, delay);
				}
				else {
					run();
				}

				function run() {				
					
					var level = Magicaster.resolveAndGetValue(magicast, layer, params.level, eventArgs);
					var name = Magicaster.resolveAndGetValue(magicast, layer, params.name, eventArgs);
					
					// global level
					if (level == "global") {
						triggerGlobalEvent(name, args);
					}

					var magicasts = params.magicast ? Magicaster.findMagicastsByName(Magicaster.resolveAndGetValue(magicast, layer, params.magicast, eventArgs)) : [magicast];
					_.each(magicasts, function (magicast) {

						// magicast level
						if (level == "magicast" || (!layer && !params.layer)) {
							triggerEvent(magicast, null, name, args);
						}
						// layer level
						else {
							var l = layer;
							if (params.layer) {
								l = magicast.findLayerByName(Magicaster.resolveAndGetValue(magicast, layer, params.layer, eventArgs));
							}
							if (l) {
								triggerEvent(magicast, l, name, args);
							}
						}
					});
				}
            }

            function resolveAndBindEventListener(magicast, layer, params, callback) {

                Magicaster.console.log("[Magicaster] resolveAndBindEventListener", magicast, layer, params);

                var root;
				var level = Magicaster.resolveAndGetValue(magicast, layer, params.level);
                var name = Magicaster.resolveAndGetValue(magicast, layer, params.name);
                var filter = "";
				
                // global level
                if (level == "global") {
                    root = document;
					name = "magicaster_global_event_" + name;
                }

                // magicast or layer level
                else {
				
					var name = "magicaster_event_" + name;

                    if (!params.magicast) {
                        root = magicast.$root;
                    }
                    else {
                        root = document;
                        filter = "[name=" + Utils.validateName(Magicaster.resolveAndGetValue(magicast, layer, params.magicast), 'Magicast') + "]";
                    }

                    // not only magicast level
                    if (level != "magicast") {
                        filter = filter +
                            (params.layer ?
                                " [name=" + Utils.validateName(Magicaster.resolveAndGetValue(magicast, layer, params.layer), 'Layer') + "]" :
                                (layer ?
                                    " [name=" + layer.name + "]" :
                                    "")
                                );
                    }
                    
                }

                // Bind the event handler and generate destroy function for the event handler

                function call_the_callback(e) {
                    var args = null;
                    if (e && e.originalEvent) {
                        args = e.originalEvent.args;
                    }
                    callback(args, e.originalEvent);
                }

                $(root).on(name, filter, call_the_callback);

                var destroyFunc = function () {
                    $(root).off(name, filter, call_the_callback);
                };
				
				return destroyFunc;
            }

            function enablePerformanceMeter() {
                if (!fpsMeter) {
                    fpsMeter = new FPSMeter({
                        interval: 100,     // Update interval in milliseconds.
                        smoothing: 10,      // Spike smoothing strength. 1 means no smoothing.
                        show: 'fps',   // Whether to show 'fps', or 'ms' = frame duration in milliseconds.
                        toggleOn: 'click', // Toggle between show 'fps' and 'ms' on this event.
                        decimals: 1,       // Number of decimals in FPS number. 1 = 59.9, 2 = 59.94, ...
                        maxFps: 60,      // Max expected FPS value.
                        threshold: 100,     // Minimal tick reporting interval in milliseconds.

                        // Meter position
                        position: 'absolute', // Meter position.
                        zIndex: 10,         // Meter Z index.
                        left: 'auto',      // Meter left offset.
                        top: '5px',      // Meter top offset.
                        right: '5px',     // Meter right offset.
                        bottom: 'auto',     // Meter bottom offset.
                        margin: '0 0 0 0',  // Meter margin. Helps with centering the counter when left: 50%;

                        // Theme
                        theme: 'transparent', // Meter theme. Build in: 'dark', 'light', 'transparent', 'colorful'.
                        heat: 1,      // Allow themes to use coloring by FPS heat. 0 FPS = red, maxFps = green.

                        // Graph
                        graph: 1, // Whether to show history graph.
                        history: 20 // How many history states to show in a graph.
                    });
                }
            }
			
			function setGlobalVariable(name, value) {
				globalVariables[name] = value;
			}

            //
            // EXECUTION
            //

            //
            // EXPORTS
            //
            return {
                $: $,
				actions: [],
                magicasts: magicasts,
                console: console,
                server: server,
                path: path,
                loadCss: loadCss,
                loadJs: loadJs,
                configuration: configuration,
                findMagicastsByName: findMagicastsByName,
                start: start,
                enable_hbbtv_functionality: enable_hobbytv_functionality,
                changePath: changePath,
                applyCdGroup: applyCdGroup,
                removeFromCd: removeFromCd,
                triggerEvent: triggerEvent,
                triggerGlobalEvent: triggerGlobalEvent,
                resolveAndGetValue: resolveAndGetValue,
                resolveAndTriggerEvent: resolveAndTriggerEvent,
                resolveAndBindEventListener: resolveAndBindEventListener,
                enablePerformanceMeter: enablePerformanceMeter,
                showStatus: showStatus,
                hideStatus: hideStatus,
				process: process,
				setGlobalVariable: setGlobalVariable,
                getObjectIndex: function () {
                    return objectIndex++;
                }
            };

        })();

        return Magicaster;
    });