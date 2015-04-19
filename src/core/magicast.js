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
        "utils/utils",
        "core/layer",
        "core/trigger",
        "core/layout",
        "core/capabilities"],
    function ($, Utils, Layer, Trigger, Layout, Capabilities) {

        "use strict";

        /**
         * Magicast represents single Magicast in a web page.
         * @class
         * @name Magicast
         * @fires magicaster_magicastLoading
         * @fires magicaster_magicastLoaded
         * @fires magicaster_magicastStarting
         * @fires magicaster_magicastStarted
         * @fires magicaster_magicastInitializeError
         * @fires magicaster_magicastLoadError
         * @fires magicaster_magicastNotFoundError
         * @fires magicaster_magicastRequirementsError
         */
        function Magicast(magicast, container) {

            /** @lends Magicast **/
            if (!(this instanceof Magicast)) {
                throw new TypeError("Constructor cannot be called as a function.");
            }
			
            //
            // DEFINITIONS
            //

            var self = this;
            self.index = Magicaster.getObjectIndex();
            var log = Magicaster.console.log;
			
            // Deferred for initialization, most importantly getting data from server using Magicast's id
            var initializeDeferred = $.Deferred();
            // Deferred for the actual start (all layers ready and running)
            var startDeferred = $.Deferred();

            /**
             * Layout instance. Each Magicast has its own.
             * @memberOf Magicast
             * @name Magicast#layout
             * @public
             * @type {Layout}
             */
			 			 
            self.layout = new Layout(self);    // Each Magicast has its own Layout Manager instance
			
            //
            // Data structures
            //

            var fonts;
            var cssRules;
            var nodes;
			
			var styles = [];
			
			var properties = {};
			
			self.getProperties = function() {
				return properties;
			};

            var node = null;
			var oldNode = null;
			
            var layers = [];
			self.getLayers = function() {
				return layers;
			};
			var oldLayers = null;

            var triggers = [];
			self.getTriggers = function() {
				return triggers;
			};
			var oldTriggers = [];

            var variables = {};

            /**
             * Magicast's jQuery root element. This is placed within the container defined
             * in the containing HTML file by the designer.
             * @memberOf Magicast
             * @name Magicast#$root
             * @public
             * @type {jQuery}
             */
            self.$root = $(container).find('.magicaster-magicast');

            /**
             * Magicast's jQuery stage element. Reserved for future purpose
             * @memberOf Magicast
             * @name Magicast#$stage
             * @public
             * @type {jQuery}
             */
            self.$stage = $(container).find('.magicaster-magicast-stage');

            /**
             * Magicast's jQuery viewport element. Handles the visible viewport of the magicast.
             * @memberOf Magicast
             * @name Magicast#$viewport
             * @public
             * @type {jQuery}
             */
            self.$viewport = $(container).find('.magicaster-magicast-viewport');

            //
            // LOCAL FUNCTIONS
            //

            /**
             * Process Magicast data.
             * @param data Magicast data
             * @returns {promise}
             */
            function processData(data) {

                var d = $.Deferred();

                self.debug = data.debug === "true" || false;
                self.performance = data.performance === "true" || false;
                self.name = Utils.validateName(data.name, "Magicast");

                if (data.minWidth || data.maxWidth || data.minHeight || data.maxHeight) {
                    var pf = parseFloat;
                    self.scalingDims = {
                        minw: pf(data.minWidth),
                        maxw: pf(data.maxWidth),
                        minh: pf(data.minHeight),
                        maxh: pf(data.maxHeight)
                    };
                }

                self.$root.attr({id: "magicaster-magicast-" + self.index, name: self.name});
                self.$root.parent().css({"pointer-events": "none"});

                /**
                 * Fired when magicast has been initialized and before it is started
                 * @event
                 * @name magicaster_magicastInitialized
                 * @param {jQuery} root jQuery object for the Magicast's root
                 * @param {Magicast} magicast Reference to Magicast instance
                 * @param {string} name Name of the Magicast
                 */
                Utils.dispatchEvent("magicaster_magicastInitialized", {
                    "root": self.$root,
                    "magicast": self,
                    "name": self.name
                }, self.$root[0]);

                // Check the requirements for the magicast
				
				var requirements = Utils.convertToArray(data, "requirements");
                var failed = [];
                if (!Capabilities.validateRequirements(requirements, failed)) {
                    showStatus('requirementsError');

                    /**
                     * Fired when at least one of the Magicast's requirements are not met.
                     * @event
                     * @name magicaster_magicestRequirementsError
                     * @param {jQuery} root jQuery object for the Magicast's root
                     * @param {Magicast} magicast Reference to Magicast instance
                     * @param {string} name Name of the Magicast
                     * @param {array} requirements Array holding all the requirements
                     * @param {array} failed Array holding the failed requirements
                     */
                    Utils.dispatchEvent("magicaster_magicestRequirementsError", {
                        "root": self.$root,
                        "magicast": self,
                        "name": self.name,
                        "requirements": requirements,
                        "failed": failed
                    }, self.$root[0]);

                    d.reject();
                }
                else {
				
					fonts = Utils.convertToArray(data, "font");
					cssRules = Utils.convertToArray(data, "cssRule");
                    nodes = Utils.convertToArray(data, "node");

                    /**
                     * Raised when Magicast starts.
                     * @event
                     * @name magicaster_magicastStarting
                     * @param {jQuery} root jQuery object for the Magicast's root
                     * @param {Magicast} magicast Reference to Magicast instance
                     * @param {String} name Name of the Magicast
                     */
                    Utils.dispatchEvent("magicaster_magicastStarting", {
                        "root": self.$root,
                        "magicast": self,
                        "name": self.name
                    }, self.$root[0]);

                    d.resolve();
                }

                return d.promise();
            }

            /**
             * Finds trigger by name
             * @param name Name of the trigger
             * @returns {Trigger}
             */
            function findTriggerByName(name) {
                return _.find(triggers, {name: name});
            }

            /**
             * Removes found element from elementArray
             * @param elementArray
             * @param name
             * @returns {*}
             */
            function findAndRemoveElementByName(elementArray, name) {
                var foundElement = null;
                elementArray.forEach(function (object, index, array) {
                    if (object.name === name) {
                        var foundElementArr = array.splice(index, 1);
                        foundElement = foundElementArr[0];
                    }
                });
                return foundElement;
            }

            function showStatus(type, parameters) {
                Magicaster.showStatus(self, self.$root[0], type, parameters);
            }

            function hideStatus(type) {
                return Magicaster.hideStatus(self, self.$root[0], type);
            }

            //
            // PUBLIC METHODS
            //

            /**
             * Finds and returns layer object according to the name
             * @public
             * @function
             * @name Magicast#findLayerByName
             * @param name Name of the layer
             * @returns {Layer}
             */
            self.findLayerByName = function (name) {
                return _.find(layers, {name: Utils.validateName(name, 'Layer')});
            };

            /**
             * Creates layers for the Magicast
             * Note! Magicast handles the creation instead of Node because layers can live through several nodes.
             * @public
             * @function
             * @name Magicast#createLayers
             * @param layers JSON data for the layers
             */
            self.createLayers = function (data, refresh) {
                var newLayers = [];

                // Already existing layers are preserved (identified by the name)
                // EXCEPT IF the overwrite flag is turned on. In that case layer is re-created.
                data.forEach(function (layerData, index) {
                    var overwrite = layerData.overwrite || "false";

                    if (!refresh && overwrite === "false") {
                        // check if layer exists and move it to new node
                        var existingLayer = findAndRemoveElementByName(layers, Utils.validateName(layerData.name, "Layer"));
                        if (existingLayer) {
                            log("[Magicast] found existing layer", existingLayer);
                            newLayers.push(existingLayer);
                        }
                        else {
                            log("[Magicast] Creating new layer", layerData);
                            newLayers.push(Utils.createObject(Layer, layerData, self, index));
                        }
                    }
                    else {  // overwrite === true -- always create a new layer
                        log("[Magicast] Creating new layer", layerData);
                        newLayers.push(Utils.createObject(Layer, layerData, self, index));
                    }
                });

				// add new layers to DOM
				_(newLayers).each(function (layer) {
					var $clipper = layer.getClipper();
					if (!$.contains(self.$viewport.get(0), $clipper.get(0))) {
						self.$viewport.append($clipper);
						$clipper.hide();
					}
				});
				
				oldLayers = layers;
                layers = newLayers;
            };

            /**
             * Creates triggers for the Magicast
             * @public
             * @function
             * @name Magicast#createTriggers
             * @param data JSON data for triggers
             */
            self.createTriggers = function (data, refresh) {
                var newTriggers = [];
				
                // Already existing triggers are preserved (identified by the name)
                // EXCEPT IF the overwrite flag is turned on. In that case trigger is re-created.
                data.forEach(function (triggerData, index) {
                    var overwrite = triggerData.overwrite || "false";

                    if (!refresh && overwrite === "false") {
                        var existingTrigger = findAndRemoveElementByName(triggers, Utils.validateName(triggerData.name, "Layer"));
                        if (existingTrigger) {
                            log("[Magicast] Found existing trigger", existingTrigger);
                            existingTrigger.setIndex(index);
                            newTriggers.push(existingTrigger);
                        }
                        else {
                            log("[Magicast] Creating new trigger", triggerData);
                            newTriggers.push(Utils.createObject(Trigger, triggerData, self, index));
                        }
                    }
                    else {  // overwrite === true -- anyway create a new trigger
                        log("[Magicast] Overwriting existing trigger", triggerData);
                        newTriggers.push(Utils.createObject(Trigger, triggerData, self, index));
                    }
                });				

				oldTriggers = triggers;
                triggers = newTriggers;
            };

            /**
             * Sets variable for Magicast
             * @public
             * @function
             * @name Magicast#setVariable
             * @param name Name of the variable
             * @param value New value
             */
            self.setVariable = function (name, value) {
                name = $.trim(name);
                log("[Magicast] setVariable", name, value);
                variables[name] = value;
            };

            /**
             * Gets variable value
             * @public
             * @function
             * @name Magicast#getVariable
             * @param name Name of the variable to get
             * @returns {*}
             */
            self.getVariable = function (name) {
                name = $.trim(name);
                var value = variables[name];
                log("[Magicast] getVariable", name, value);
                return value;
            };

            self.resolveAndGetValue = function (params, eventArgs) {
                return Magicaster.resolveAndGetValue(self, null, params, eventArgs);
            };
            self.resolveAndGetVariable = function (params) {
                return Magicaster.resolveAndGetVariable(self, params);
            };
            self.resolveAndGetProperty = function (params) {
                return Magicaster.resolveAndGetProperty(self, null, params);
            };
            self.resolveAndSetVariable = function (params, value) {
                return Magicaster.resolveAndSetVariable(self, params, value);
            };
            self.triggerEvent = function (name, args) {
                return Magicaster.triggerEvent(self, null, name, args);
            };
            self.resolveAndTriggerEvent = function (params, eventArgs) {
                return Magicaster.resolveAndTriggerEvent(self, null, params, eventArgs);
            };
            self.resolveAndBindEventListener = function (params, callback) {
                return Magicaster.resolveAndBindEventListener(self, null, params, callback);
            };

            /**
             * Change node
             * @param name Name of the node
             */
            self.changeNode = function (name, refresh) {
			
				Magicaster.console.log("[Magicast] changeNode", name);

                var d = $.Deferred();
				
				if (oldNode || (!refresh && node == name)) {
					d.resolve();
					return d.promise();
				}				
				
				var data;
				if (name == "") {
					data = nodes[0];
				} else {
					data = _.find(nodes, {name: name});
				}
				
                if (data) {
				
					showStatus('changingNode');
				
					oldNode = node;
					node = Utils.validateName(data.name, "Node");
				
					var newProperties = Utils.convertToArray(data, "property");
					
					self.createLayers(Utils.convertToArray(data, "layer"), refresh);
					self.createTriggers(Utils.convertToArray(data, "trigger"), refresh);

					var a = [];
					_.each(layers, function (layer) {
						a.push(layer.getLoadPromise());
					});
					_.each(triggers, function (trigger) {
						a.push(trigger.getLoadPromise());
					});
					
					$.when.apply(window, a).then(function () {
							
						 hideStatus('changingNode').done(function () {
						 
							oldNode = null;
						 
							// update new properties
							_(newProperties).each(function(newProperty) {
								properties[newProperty.name] = self.resolveAndGetValue(newProperty.value);
							});
							
							// remove old layers
							_(oldLayers).each(function(layer) {
								layer.destroy();
							});
							oldLayers = null;

							// remove old triggers
							_(oldTriggers).each(function (trigger) {
								trigger.destroy();
							});
							oldTriggers = null;

							// make layers visible and sort by z-index
							var i = 0;
							_(layers).each(function(layer) {
								var $clipper = layer.getClipper();
								$clipper.show();
								$clipper.css('z-index', i++);
							});
							
							// start layers
							_(layers).each(function (layer) {
								layer.start();
							});
							
							// start triggers
							_(triggers).each(function (trigger) {
								trigger.start();
							});

							startDeferred.resolve();

                            // Some debugging, if enabled.
                            if (self.debug) {
								if (!self.debugger) {
									require(["core/debugger"], function (Debugger) {
										self.debugger = Debugger;
										self.debugger.drawMagicastDebug(self);
									});
								} else {
									self.debugger.drawMagicastDebug(self);
								}
                            }

                            // And enable performance measurements
                            if (self.performance) {
                                Magicaster.enablePerformanceMeter();
                            }

							if (Magicaster.configuration.analytics) {
								Magicaster.configuration.analytics.send(magicast, "nodeChanged", node.name);
							}

                            // Fire public nodeChanged event
                            var magicastElem = self.$root[0]; // Magicast container
                            var eventData = {
                                'node': node.name,
                                'magicast': self
                            };
                            /**
                             * Fired to the Magicast container when Magicast's node is changed.
                             *
                             * @event
                             * @name magicaster_magicastNodeChanged
                             * @param node {String} Name of the new node
                             * @param magicast {Magicast} Reference to Magicast instance
                             */
                            Utils.dispatchEvent("magicaster_magicastNodeChanged", eventData, magicastElem);

							// request layout update
                            self.layout.dirty();							
	
							d.resolve();
							
						});
					
					});		
		
                }
				else {
					d.resolve();
				}
				
				return d.promise();
            };

            /**
             * Checks required scaling for the magicast.
             */
            self.checkScaling = function () {

            };

            /**
             * Public interface to execute Magicast's trigger. Trigger needs to be in
             * the active node.
             * @public
             * @function
             * @name Magicast#executeTrigger
             * @param triggerName Name of the trigger
             */
            self.executeTrigger = function (triggerName) {
                var trigger = findTriggerByName(triggerName);
                if (trigger) {
                    trigger.execute();
                }
            };

            /**
             * Getter for Magicast initialize -promise
             * @public
             * @function
             * @name Magicast#getInitializePromise
             * @returns {promise}
             */
            self.getInitializePromise = function () {
                return initializeDeferred.promise();
            };

            /**
             * Getter for Magicast start -promise
             * @public
             * @function
             * @name Magicast#getStartPromise
             * @returns {promise}
             */
            self.getStartPromise = function () {
                return startDeferred.promise();
            };
			
			/**
             * Tick
             * @public
             * @function
             * @name Magicast#tick
             */
			self.tick = function(time) {
				_(oldLayers || layers).each(function (layer) {
					if (layer && layer.getComponent() && layer.getComponent().tick) {
						layer.getComponent().tick(time);
					}
				});
				self.layout.update();
			};

            function loadAndProcessData() {
                var d = $.Deferred();

                showStatus('loading');

                Magicaster.server.callMethod('Magicast.get', { 'id': magicast.id, 'check': magicast.check })
                    .done(function (response) {
                        showStatus('loaded');
						
                        if (!response.data) {
                            showStatus('notFoundError');

                            /**
                             * Fired when Magicast has not been found
                             * @event
                             * @name magicaster_magicastNotFoundError
                             * @param {jQuery} root jQuery object for the Magicast's root
                             * @param {Magicast} magicast Reference to Magicast instance
                             */
                            Utils.dispatchEvent("magicaster_magicastNotFoundError", {"root": self.$root, "magicast": self}, self.$root[0]);

                            d.reject();
                        } else {
                            processData(response.data)
                                .done(function () {
									// Requirements met
                                    d.resolve();
                                })
                                .fail(function () {								
									// Requirements not met						
                                    d.reject();
                                });
                        }
                    })
                    .fail(function (error) {
                        showStatus('loadError');

                        /**
                         * Fired when there has been an error loading Magicast
                         *
                         * @event
                         * @name magicaster_magicastLoadError
                         * @param {jQuery} root jQuery object of magicast root
                         * @param {Magicast} magicast Reference to Magicast instance
                         */
                        Utils.dispatchEvent("magicaster_magicastLoadError", {"root": self.$root, "magicast": self}, self.$root[0]);

                        d.reject();
                    });
					
                return d.promise();
            };
			
			function loadFonts() {
				var d = $.Deferred();
				
				if (fonts.length) {
					require(["webfont"], function(WebFont) {
						var a = [];
						_(fonts).each(function (font) {
							var config;
							switch (font.source) {
								case "google":
									config = {
										google: {
											families: [font.family]
										}
									};
									break;
							}
							var d = $.Deferred();
							a.push(d.promise());
							config.active = function() {
								d.resolve();
							}
							WebFont.load(config);
						});
						$.when.apply(window, a).then(function () {
							d.resolve();
						});
					});
				} else {
					d.resolve();
				}
				
				return d.promise();
			}

            //
            // EXECUTION
            //

            log("[Magiacst] initializing", magicast);

            showStatus('initializing');

            /**
             * Fired to the Magicast container when Magicast starts to load
             *
             * @event
             * @name magicaster_magicastInitializing
             * @param {jQuery} root jQuery object of magicast root
             * @param {Magicast} magicast Reference to Magicast instance
             */
            Utils.dispatchEvent("magicaster_magicastInitializing", {"root": self.$root, "magicast": self}, self.$root[0]);

            var dataPromise;
            if (magicast.data) {
                dataPromise = processData(magicast.data);
            }
            else if (magicast.id) {
                dataPromise = loadAndProcessData()
                    .done(function () {
                        // start listening to server event Access.update, because it requires reloading
                        $(document).on('magicaster_serverEvent_Access_update', function (e) {
                            log("[Magicast] Reloading after Access.update");
                            self.loadAndProcessData()
                                .done(function () {
									self.changeNode(node, true);
                                })
                                .fail(function () {});
                        });
                    })
                    .fail(function () {});
            }
            else {
                showStatus('initializeError');

                /**
                 * Fired when Magicast can not be initialized
                 * @event
                 * @name magicaster_magicastInitializeError
                 * @param {jQuery} root jQuery object for the Magicast's root
                 * @param {Magicast} magicast Reference to Magicast instance
                 * @param {string} name Name of the Magicast
                 * @param {object} data Magicast's data
                 */
                Utils.dispatchEvent("magicaster_magicastInitializeError", { "root": self.$root, "magicast": self }, self.$root[0]);

                var d = $.Deferred();
                d.reject();
                dataPromise = d.promise();
            }

            dataPromise
                .done(function () {
				
					var fontPromise = loadFonts();
					fontPromise.done(function () {
					
	                    hideStatus('initializing');
					
						// apply CSS rules
						_(cssRules).each(function (cssRule) {
							var $style = $("<style type='text/css'></style>").appendTo("head");
							$style.text("#magicaster-magicast-" + self.index  + " " + cssRule.selector + "{" + cssRule.declaration  + "}");
							styles.push($style);
						});	
					
						// start with the first node
						if (nodes.length) {
							self.changeNode("", false).done(function () {

								/**
								 * Fired to the Magicast container when Magicast is started
								 *
								 * @event
								 * @name magicaster_magicastStarted
								 * @param {jQuery} root jQuery object of magicast root
								 * @param {Magicast} magicast Reference to Magicast instance
								 * @param {String} name Name of the magicast
								 */
								Utils.dispatchEvent("magicaster_magicastStarted", {
									"root": self.$root,
									"magicast": self,
									"name": self.name
								}, self.$root[0]);
								
								startDeferred.resolve();
							});
						}
						// no nodes, this Magicast is done!
						else {
							hideStatus('changingNode').done(function () {
								startDeferred.resolve();
							});
						}		

						initializeDeferred.resolve(); 
					});
                })
                .fail(function () {
                    showStatus('error');

                    // Problems with data (failed to load, invalid data format or requirements are not met) - this Magicast is done!
                    initializeDeferred.resolve();
                    startDeferred.resolve();
                });
        }

        return Magicast;
    }
);
