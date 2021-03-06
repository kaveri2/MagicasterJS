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

define(["jquery", "utils/utils", "core/capabilities"], function ($, Utils, Capabilities) {

    "use strict";

    /**
     * Layer is an instance of a Magicast layer.
	 * @class
	 * @name Layer
	 * @param data {Object} Layer data from XML
	 * @param magicast {Object} Object instance
     */
    function Layer(data, magicast) {
        /** @lends Layer **/
        if (!(this instanceof Layer)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }
		
        var self = this;

		self.dirty = true;

		/**
		 * Method for getting value from XML-based value syntax
		 * @name Layer#resolveAndGetValue
		 * @public
		 * @method
		 * @param data {object} Value syntax data
		 * @param eventArgs {object} Triggering event's arguments
		 * @returns {object}
		 */
        self.resolveAndGetValue = function (params, eventArgs) {
            return Magicaster.resolveAndGetValue(magicast, self, params, eventArgs);
        };
		
		/**
		 * Method for triggering event, only on this layer.
		 * @name Layer#triggerEvent
		 * @public
		 * @method
		 * @param name {sting} Event name
		 * @param args {object} Event argument
		 */		
        self.triggerEvent = function (name, args) {
            return Magicaster.triggerEvent(magicast, self, name, args);
        };
		
		/**
		 * Method for triggering event using XML-based event syntax.
		 * @name Layer#resolveAndTriggerEvent
		 * @public
		 * @method
		 * @param data {object} Event syntax data
		 */		
        self.resolveAndTriggerEvent = function (params) {
            return Magicaster.resolveAndTriggerEvent(magicast, self, params);
        };
		
		/**
		 * Method for binding to events using XML-based event syntax.
		 * @name Layer#resolveAndBindEventListener
		 * @public
		 * @method
		 * @param data {object} Event syntax data
		 * @param callback {function} Called when event happens
		 */		
        self.resolveAndBindEventListener = function (params, callback) {
            return Magicaster.resolveAndBindEventListener(magicast, self, params, callback);
        };		
		
        self.index = Magicaster.getObjectIndex();
        self.name = Utils.validateName(self.resolveAndGetValue(data.name), "Layer");
		
		self.getMagicast = function() {
			return magicast;
		};
		
        // For asynchronous loading
        var loadDeferred = $.Deferred();
		/**
		 * Returns the loadPromise, which is resolved when the component has been loaded
		 * and it's loadPromise has been resolved.
		 * @name Layer#getLoadPromise
		 * @public
		 * @method
		 * @returns {promise}
		 */
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		}

        // Will contain the layer's component once it has been created from the asset
		var component = undefined;
		/**
		 * Returns the component object.
		 * @name Layer#getComponent
		 * @public
		 * @method
		 * @returns {Object}
		 */
		self.getComponent = function() {
			if (started) {
				return component;
			}
		};

        // Trigger public loading event start
        /**
         * Fired when layer starts loading
         * @event
         * @name magicaster_layerLoading
         * @param layer {Layer} Layer instance
         * @param name {String} Name of the layer
         * @param magicast {Object} Layer's parent magicast instance
         */
        Utils.dispatchEvent("magicaster_layerLoading", {"layer": self, "name": self.name, "magicast": magicast}, magicast.$root[0]);

        var asset = Utils.convertToArray(data, "asset")[0];
		var parameters = Utils.convertToArray(data, "parameters")[0];

        // Layer properties are defined within Magicast definition (XML) and they are not changed
        // by the layout manager/layer
        var properties = {};
        _.each(Utils.convertToArray(data, "property"), function (property) {
            properties[magicast.resolveAndGetValue(property.name)] = magicast.resolveAndGetValue(property.value);
        });
		
		_(properties).each(function(value, property) {
			properties[property] = validatePropertyValue(property, value);
		});
		
        // Default layer properties
        _.defaults(properties, {
            rotation: 0,
            skewX: 0,
            skewY: 0,
            scaleX: 100,
            scaleY: 100,
            alpha: 100,
            moveX: 0,
            moveY: 0,
            absX: undefined,
            absY: undefined,
            relX: undefined,
            relY: undefined,
            selfRelX: undefined,
            selfRelY: undefined,
            absReferenceX: undefined,
            absReferenceY: undefined,
            relReferenceX: undefined,
            relReferenceY: undefined,
            maintainAspectRatio: true,
            aspectRatio: undefined,
			refFrameAnchorX: true,
			refFrameAnchorY: true,
			refFrameAnchorScaleX: true,
			refFrameAnchorScaleY: true,
			refFrameAnchorRotation: true,
			refFrameAnchorAlpha: true,
			visible: true,
			draggable: false,
			enablePointer: true,
			accelerated: false,
			selectable: false,
			cursor: "default"
        });
		
		/**
		 * Getter for layer's properties.
		 * @name Layer#getProperties
		 * @public
		 * @method
		 * @returns {Array}
		 */
		self.getProperties = function() {
			return properties;
		};			
		
        // Layer's calculations are run-time calculated values mainly by layout manager
        var calculations = {};
		/**
		 * Getter for layer's current calculations.
		 * @name Layer#getCalculations
		 * @public
		 * @method
		 * @returns {Array}
		 */
		self.getCalculations = function() {
			return calculations;
		}
		
        // Define geometry properties
        var geometry = {
			width: 0,
			height: 0
        };
		/**
		 * Getter for layer's geometry object. Currently supported: width and height
		 * @name Layer#getGeometry
		 * @public
		 * @method
		 * @returns {Object}
		 */
		self.getGeometry = function() {
			return geometry;
		};
		/**
		 * Setter for layer's geometry object. Currently supported: width and height
		 * @name Layer#setGeometry
		 * @public
		 * @method
         * @param value {Object} New geometry object
		 */
		self.setGeometry = function(value) {
			/*
			if (geometry.width != value.width || geometry.height != value.height) {
				self.dirty = true;
			}
			*/
			geometry = value;
		};
		
		function validatePropertyValue(name, value) {
			if ($.inArray(name, ["visible", "enablePointer", "selectable", "draggable", "accelerated", "triggerVisibilityEvents", "refFrameAnchorX", "refFrameAnchorY", "refFrameAnchorScaleX", "refFrameAnchorScaleY", "refFrameAnchorRotation", "refFrameAnchorAlpha"]) != -1) {
				return value === "true";
			};
			var floatValue = parseFloat(value);	
			if (!isNaN(floatValue)) {
				return floatValue;
			}
			return value;
		}		
		
		var animations = {};
		self.animateProperty = function(name, value, ease, time, callback, speed) {
						
			/*
			var makesDirty = $.inArray(name, [
				"relX", "absX", "relReferenceX", "absReferenceX", "relWidth", "absWidth", "selfRelX", "scaleX", "moveX",
				"relY", "absY", "relReferenceY", "absReferenceY", "relHeight", "absHeight", "selfRelY", "scaleY", "moveY",
				"rotation", "alpha", "maintainAspectRatio",
				"refFrame", "refFrameAnchorRotation", "refFrameAnchorAlpha",
				"refFrameAnchorX", "refFrameAnchorWidth", "refFrameAnchorScaleX",
				"refFrameRelX", "refFrameAbsX", "refFrameRelWidth", "refFrameAbsWidth", "refFrameSelfRelX",
				"refFrameAnchorY", "refFrameAnchorHeight", "refFrameAnchorScaleY",
				"refFrameRelY", "refFrameAbsY", "refFrameRelHeight", "refFrameAbsHeight", "refFrameSelfRelY"
			]) != -1;
			*/
			
			var makesDirty = true;
			
			value = validatePropertyValue(name, value);
			
			// if property is not number, it can't be animated
			if (typeof value != "number") {
				properties[name] = value;
                if (makesDirty) {
					self.dirty = true;
				}
				if (callback) {
					callback();
				}
				return;
			}

			var startValue = properties[name] || 0;
			
			var step;
			if (makesDirty) {
				step = function (now) {
                    properties[name] = now;
					self.dirty = true;
				};
			} else {
				step = function (now) {
                    properties[name] = now;
				};
			}

            if (animations["property_" + name]) {
				animations["property_" + name].stop();
			}
			// stored only to avoid duplicate overlapping animations
            animations["property_" + name] = $.ease(
                startValue || 0,
                value,
                (speed ? Math.abs(startValue - value) / time : time) * 1000,
                ease,
                step,
                callback ? callback : $.noop
            );
		}
		self.animateCssProperty = function(selector, name, value, ease, time, callback) {						
		
			var makesDirty = true;
		
			var properties = {};
			properties[name] = value;			

            if (animations["css_" + selector + "_" + name]) {
				animations["css_" + selector + "_" + name].stop();
			}
			
			var $target = selector  ? $content.find(selector) : $content;
						
			// stored only to avoid duplicate overlapping animations
            animations["css_" + selector + "_" + name] = $target.animate(
                properties,
                {
					duration: time * 1000,
					easing: ease,
					step: makesDirty ? function() {
						self.dirty = true;
					} : $.noop,
					complete: callback ? callback : $.noop
				}
            );
			
			// TODO: apply css when calculating dirty layer, to stop flickering!
		};
		
        // Asynchronously loads required component JavaScript using RequireJS methods
        function initializeComponent(asset, params) {
		
            Magicaster.console.log("[Layer] initializeComponent", asset);

            /**
             * Helper function to handle resolved and found component
             */
            function componentFound(Component) {
                if (Component) {
				
                    component = new Component(params, self);

                    // Check the component requirements
                    var requirements = component.getRequirements ? component.getRequirements() : [];
                    var failedRequirements = [];
                    if (Capabilities.validateRequirements(requirements, failedRequirements)) {
                        if (component.getLoadPromise) {
                            Magicaster.console.log("[Layer] component load promise found", self, component);
                            component.getLoadPromise().always(function () {
								Magicaster.console.log("[Layer] component loaded", self, component);
                                loadDeferred.resolve();
                            }).fail(function (error) {
                                Magicaster.console.error(error);
                            });
                        }
                        else {
                            Magicaster.console.log("[Layer] component load promise not found", self, component);
                            loadDeferred.resolve();
                        }
                    }
                    else {
                        // Requirements have not been met.
 
						if (component.destroy) {
							component.destroy();
						}
						
                        component = null;
                        loadDeferred.resolve();

                        /**
                         * Event which is fired where there are one or more requirements that are required
                         * by the layer but not supported by running platform.
                         * @event
                         * @name magicaster_layerRequirementsFail
                         * @param {Layer} layer Layer instance
                         * @param {String} name Name of the layer
                         * @param {Array<String>} requirements Layer's requirements
                         * @param {Array<String>} failedRequirements Array of failed requirements
                         */
                        Utils.dispatchEvent("magicaster_layerRequirementsFail", {
                            "layer": self,
                            "name": self.name,
                            "requirements": requirements,
                            "failed": failedRequirements
                        }, component.$root[0]);
                    }
                }
                else {
                    componentNotFound();
                }
            }

            /**
             * Helper function to handle not found component case
             */
            function componentNotFound() {
			
                Magicaster.console.error("[Layer] component not found", self, url);
				
                component = null;
                loadDeferred.resolve(null);

                /**
                 * Event which is fired where layer component cannot be resolved and found by the loader.
                 * @event
                 * @name magicaster_layerNotFound
                 * @param layer {Layer} Layer instance
                 * @param name {String} Name of the layer
                 * @param asse {Object} Layer's asset from XML
                 */
                Utils.dispatchEvent("magicaster_layerNotFound", {
                    "layer": self,
                    "name": self.name,
                    "asset": asset
                }, magicast.$root[0]);
            }

            Magicaster.console.log("[Layer] resolving component", self);
			
            // Resolve actual component and provide appropriate callbacks for success and fail cases
            var url = self.resolveAndGetValue(asset);
            if (url) {
                require([url], componentFound, componentNotFound);
            }
        }


		/**
		 * Getter for clipper jQuery object. Used internally for masking layer into Magicast object's container.
		 * @name Layer#getClipper
		 * @public
		 * @method
		 * @returns {jQuery}
		 */
		 self.getClipper = function () {
            return $clipper;
        };

		/**
		 * Getter for container jQuery object. Used internally by layout manager.
		 * @name Layer#getContainer
		 * @public
		 * @method
		 * @returns {jQuery}
		 */
        self.getContainer = function () {
            return $container;
        };

		/**
		 * Getter for content jQuery object. Used by the component.
		 * @name Layer#getContent
		 * @public
		 * @method
		 * @returns {jQuery}
		 */
        self.getContent = function () {
            return $content;
        };

		/**
		 * Destructor
		 * @name Layer#destroy
		 * @public
		 * @method
		 */
        self.destroy = function () {
            Magicaster.console.log("[Layer] destroy", self);

            Magicaster.removeFromCd(self);
			
            // Destroy component
            if (component && component.destroy) {
				component.destroy();
			}
			
            $content.remove();
            $container.remove();
            $clipper.remove();
        };

        /**
         * Adds given CSS classes to the content element.
         * @name Layer#addCssClass
		 * @public
         * @method
		 * @param classes {String/Array} CSS class or array of CSS classes
         */
        self.addCssClass = function (classes) {
			Magicaster.console.log("[Layer] addCssClass", self, classes);
			if (_.isArray(classes)) {
				$content.addClass(classes.join(' '));
			} else {
				$content.addClass(classes);
			}
        };

        /**
         * Removes given CSS classes from the content element.
         * @name Layer#removeCssClass
		 * @public
         * @method
		 * @param classes {String/Array} CSS class or array of CSS classes
         */
        self.removeCssClass = function (classes) {
			Magicaster.console.log("[Layer] removeCssClass", self, classes);
			if (_.isArray(classes)) {
				$content.removeClass(classes.join(' '));
			} else {
				$content.removeClass(classes);
			}
        };

        /**
         * Adds given CSS text to the content element.
         * @name Layer#setCssText
		 * @public
         * @method
		 * @param cssText {Object} CSS style definition object
         */
        self.setCssText = function (cssText) {
			Magicaster.console.log("[Layer] setCssText", self, cssText);
			$content.css('cssText', $content.css('cssText') + ";" + cssText);
        };	

		var started = false;
		
		/**
		 * Returns if layer is started
		 * @name Layer#isStarted
		 * @public
		 * @method
		 */
		self.isStarted = function() {
			return started;
		}
		
		/**
		 * Start's the layer
		 * @name Layer#start
		 * @public
		 * @method
		 */
        self.start = function () {
            // Check that no duplicate starts are done
            if (started) {
                return;
            }
            started = true;
			
            Magicaster.console.log("[Layer] start", self);
            
			// Start the component
			if (component && component.start) {
				component.start();
			}

			/**
			 * Fired when layer has been started
			 * @event
			 * @name magicaster_layerStarted
			 * @param layer {Layer} Layer instance
			 * @param magicast {Object} Layer's parent magicast instance
			 */
			Utils.dispatchEvent("magicaster_layerStarted", {"layer": self, "magicast": magicast}, magicast.$root[0]);
        };
		
		var $clipper = $("<div class='magicaster-magicast-layer-clipper'></div>")
			.attr({
				name: self.name + "_clip"
			})
			.css({
				position: "absolute",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				"transform-origin": "0px 0px"
			});
			
		var $container = $("<div class='magicaster-magicast-layer-container' data-type='layer'></div>").attr({name: self.name});
		$clipper.append($container);
		
		var $content = $("<div class='magicaster-magicast-layer-content'></div>");
		$container.append($content);

		$container.on("click", function () {
			self.triggerEvent("click", {"layer": self.name});
		});
	
		Utils.addDragSupport($container[0], $container[0], self, false);

		Utils.convertToArray(data, "collisionDetectionGroup").forEach(function (cdGroup) {
			Magicaster.applyCdGroup(magicast, self, 
					self.resolveAndGetValue(cdGroup.global) == "true", 
					self.resolveAndGetValue(cdGroup.name), 
					self.resolveAndGetValue(cdGroup.source) == "true", 
					self.resolveAndGetValue(cdGroup.target) == "true");
		});
		
		// Add CSS classes and styles possibly defined in XML
		if (data.css) {
			if (data.css.class) {
				self.addCssClass(self.resolveAndGetValue(data.css.class));
			}
			if (data.css.text) {
				self.setCssText(self.resolveAndGetValue(data.css.text));
			}
		}

		$.when(loadDeferred).then(function () {
			/**
			 * Fired when layers has been loaded
			 * @event
			 * @name magicaster_layerLoaded
			 * @param layer {Layer} Layer instance
			 * @param magicast {Object} Layer's parent magicast instance
			 */
			Utils.dispatchEvent("magicaster_layerLoaded", {"layer": self, "magicast": magicast}, magicast.$root[0]);
		});

		// Initialize layer asset (creates component)
		if (asset) {
			initializeComponent(asset, parameters);
		} else {
			loadDeferred.resolve();
		}
		
    }

    return Layer;
});