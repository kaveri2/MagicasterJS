/**
 * Created with IntelliJ IDEA.
 * User: Jarno
 * Date: 26.8.2013
 * Time: 12:38
 * To change this template use File | Settings | File Templates.
 */
define(["jquery", "lodash"], function ($, _) {
    "use strict";

    /**
     * Utils module.
     * @namespace Utils
     * @version 1.0
     */

    var Utils = (function () {
        /** @lends Utils **/

        /**
         * Converts a property of certain name to an array of property values if it isn't already
         * @public
         * @function
         * @name Utils#convertToArray
         * @param data Object containing the property to be converted
         * @param name Name of the property to be converted to array
         * @returns {Array}
         */
        function convertToArray(data, name) {
            return data[name] ? _.flatten([data[name]], true) : [];
        }

        /**
         * Converts and array of objects containing key and value to one object containing the key/value pairs.
         * <caption>Example usage:</caption>
         * <code>Utils.convertArrayToKeyValue([{name:"x",value:1},{name:"y",value:2}], "name", "value");</code><br/>
         * <code>// returns {x:1,y:2}</code>
         * @public
         * @function
         * @name Utils#convertArrayToKeyValue
         * @param {Array<Object>} array - Array containing the objects with source data
         * @param {String} key - name of the object property to use as key
         * @param {String} value - name of the object property to use as value
         * @returns {Object} - An object containing the values mapped by key
         */
        function convertArrayToKeyValue(array, key, value) {
            var obj = {};
            _.each(array, function (object) {
                obj[object[key]] = object[value];
            });
            return obj;
        }

        /**
         * Performs name validation for object names. If no name is given a name will be generated using the given prefix and current timestamp.
         * Also replaces white spaces in the name with underscore.
         * @public
         * @function
         * @name Utils#validateName
         * @param {String} name - Name of the object
         * @param {String} prefix - Prefix to use with the name, only used if no name is given
         * @returns {String} - A proper name that can be used for an object
         */
        function validateName(name, prefix) {
            name = $.trim(name);
            name = name.replace(/\s/g, "_");
            return name;
        }

        /**
         * A method used to make an element draggable, can be used on any html element or magicast layer.
         * @public
         * @function
         * @name Utils#addDragSupport
         * @param {HTMLElement} dragArea - Element that the dragging can be performed on
         * @param {HTMLElement} elementToDrag - Element that will be moved (can be different from dragArea)
         * @param {MCLayer} layer - If dragging a Magicast layer, pass the layer so the layer properties can be updated
         * @param {Boolean} allowDragOutside - A boolean value indicating whether the element can be dragged outside of it's parent's bounds or not.
         * (does not apply to magicast layers, those have their own way of restricting their drag area)
         * @fires dragStart
         * @fires dragMove
         * @fires dragEnd
         */
        function addDragSupport(dragArea, elementToDrag, layer, allowDragOutside) {
            var wrap = $(elementToDrag);
            var drag = dragArea;

            function ds(e) {
                if ((layer && layer.getProperties().draggable === true) || !layer) {
                    dragStart(e);
                }
            }

            function dragStart(event) {
                var ev = event.changedTouches ? event.changedTouches[0] : event;
                var dragX = layer ? layer.getProperties().dragX || 0 : wrap.data("dragX") || 0;
                var dragY = layer ? layer.getProperties().dragY || 0 : wrap.data("dragY") || 0;
                wrap.data({"x": ev.pageX, y: ev.pageY, origX: dragX, origY: dragY, started: true});
                if ('ontouchstart' in document.documentElement) {
                    document.addEventListener("touchmove", dragMove, true);
                    document.addEventListener("touchend", dragEnd, true);
                }
                else {
                    document.addEventListener("mousemove", dragMove, true);
                    document.addEventListener("mouseup", dragEnd, true);
                }
                $("body").css({"user-select": "none"});
                layer.triggerEvent("dragStart");
            }

            function cancelClick(event) {
                event.preventDefault();
                event.stopPropagation();
            }

            function dragMove(event) {
                if (!wrap.data("started")) {
                    return;
                }
                var ed = event.changedTouches ? event.changedTouches[0] : event;
                drag.addEventListener("click", cancelClick, true);
                event.preventDefault();
                var x = ed.pageX - wrap.data("x") + wrap.data("origX");
                var y = ed.pageY - wrap.data("y") + wrap.data("origY");
                if (!allowDragOutside && !layer) {
                    var maxX = wrap.parent().width() - wrap.width();
                    var maxY = wrap.parent().height() - wrap.height();
                    x = x < 0 ? 0 : x;
                    y = y < 0 ? 0 : y;
                    x = x > maxX ? maxX : x;
                    y = y > maxY ? maxY : y;
                }
                wrap.data({
                    moveX: x,
                    moveY: y
                });
                if (layer) {
					var layerProperties = layer.getProperties();
					layerProperties.moveX = x;
					layerProperties.moveY = y;
					layer.dirty = true;
                }
                else {
                    wrap.css({
                        left: x,
                        top: y
                    });
                }
                layer.triggerEvent("dragMove");
            }

            function dragEnd(event) {
                wrap.data("started", false);
                if ('ontouchstart' in document.documentElement) {
                    document.removeEventListener("touchmove", dragMove, true);
                    document.removeEventListener("touchend", dragEnd, true);
                }
                else {
                    document.removeEventListener("mousemove", dragMove, true);
                    document.removeEventListener("mouseup", dragEnd, true);
                }
                setTimeout(function () {
                    drag.removeEventListener("click", cancelClick, true);
                }, 0);

                $("body").css({"user-select": "text"});
                layer.triggerEvent("dragEnd");
            }

            if ('ontouchstart' in document.documentElement) {
                drag.addEventListener("touchstart", ds, true);
            }
            else {
                drag.addEventListener("mousedown", ds, true);
            }
        }

        /**
         * Dispatches events with pure Javascript, so not jQuery dependency is needed.
         * jQuery's $(document).trigger fails to be handled with document.addEventListener:
         * http://bugs.jquery.com/ticket/11047
         * @public
         * @function
         * @name Utils#dispatchEvent
         * @param {String} eventName - Name of the event to trigger
         * @param {Object} params - An object containing the properties that should be accessible in the event handler.
         * @param {Object} element - Optional parameter to provide element where event is triggered. If not given, defaults to document.
         * These properties will be available under the event object in the event handler.
         */
        function dispatchEvent(eventName, params, element) {
			Magicaster.console.log("[Utils] dispatchEvent", eventName, params);
            var event;
            var targetElem = element || document;
            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent(eventName, true, true);
            } else {
                event = document.createEventObject();
                event.eventType = eventName;
            }

            _.each(params, function (value, key) {
                event[key] = value;
            });

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

        /**
         * Checks for a collision between the 2 elements.
         * @public
         * @function
         * @name Utils#checkForCollision
         * @param {HTMLElement} a - An element
         * @param {HTMLElement} b - Another element
         * @returns {Boolean} - A Boolean value indicating whether the elements collide or not.
         */
        function checkForCollision(a, b) {
			var ra = a.getBoundingClientRect();
			var rb = b.getBoundingClientRect();
            return !(
                (ra.bottom < rb.top) ||
                    (ra.top > rb.bottom) ||
                    (ra.right < rb.left) ||
                    (ra.left > rb.right)
                );
		}

        /**
         * Gets the size magicast needs in order to fit all content on screen( reserved for future use )
         * @private
         * @function
         * @name Utils#getDimensionsForMagicastToFitAllContent
         * @param {MCObject} mc - Magicast
         * @returns {Array} - Array containing the dimensions
         */
        function getDimensionsForMagicastToFitAllContent(mc){
            var maxX = _(mcjs).map(function (layer) {
                return layer.getProperties().relX || layer.getProperties().relWidth ? 0 : layer.getProperties().x + layer.getProperties().width;
            }).max().value();
            var maxY = _(mcjs).map(function (layer) {
                return layer.getProperties().relY || layer.getProperties().relHeight ? 0 : layer.getProperties().y + layer.getProperties().height;
            }).max().value();
            return [maxX,maxY];
        }

        /**
         * Delays function execution for a given time.
         * @public
         * @function
         * @name Utils#delay
         * @param {Function} delayedFunction - Function to be delayed
         * @param {Number} delayTime - Delay time in milliseconds
         * @returns {Number} - ID for cancelling delay.
         */
        function delay(delayedFunction, delayTime) {
            return setTimeout(delayedFunction, delayTime || 0 );
        }

        /**
         * Converts given object to CSS string which can be used in cssText
         * @public
         * @function
         * @name Utils#convertToCssString
         * @param {Object} cssObject - Object containing CSS values
         * @returns {String} - CSS text with semicolon separation
         */
        function convertToCssString(cssObject) {
            var cssString = "";
            _(cssObject).each(function(value, key) {
                cssString += key + ": " + value + "; ";
            });
            return cssString;
        }

        /**
         * Generates CSS variants for CSS property
         * @public
         * @function
         * @name Utils#generateCssVariants
         * @param property {String} CSS property name
         * @param value {String} CSS value
         * @returns {Object} CSS properties
         */
        function generateCssVariants(property, value) {
            var obj = {};
            _.each(["", "-webkit-", "-moz-", "-ms-", "-o-"], function (variant) {
                obj[variant + property] = value;
            });
            return obj;
        }
		
		/**
		 * Call callbacks in order. Sorting and calling happens
		 * after all asynchronous calls (events) have been processed.
		 * @function
		 * @name Utils#callInOrder
		 * @param {Number} order - Order
		 * @param {Function} callback - Callback
		 */
		var orderedCalls = [];
		function callInOrder(order, callback) {
			if (orderedCalls.length === 0) {
				setTimeout(function() {
					while (orderedCalls.length) {
						orderedCalls.sort(function(a,b){return a.ordering - b.ordering;});
						var orderedCall = orderedCalls.shift();
						orderedCall.callback();
					}
				}, 0);
			}
			orderedCalls.push({ order: order, callback: callback });
		}

        return {
            convertToArray: convertToArray,
            validateName: validateName,
            convertArrayToKeyValue: convertArrayToKeyValue,
            addDragSupport: addDragSupport,
            dispatchEvent: dispatchEvent,
            checkForCollision: checkForCollision,
            delay: delay,
            convertToCssString: convertToCssString,
            generateCssVariants: generateCssVariants,
			callInOrder: callInOrder
        };
    })();
	
    return Utils;
});
