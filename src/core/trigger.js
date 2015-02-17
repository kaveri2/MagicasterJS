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

define(["jquery", "core/action", "utils/utils"], function ($, Action, Utils) {
    "use strict";

    /**
     * Trigger is an instance of a Magicast trigger.
     * @class
     * @name Trigger
     */
    function Trigger(data, component) {
        /** @lends Trigger **/
        if (!(this instanceof Trigger)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }

        if (!data) {
            throw new TypeError("Invalid parameter");
        }
		
        var self = this;

        /**
         * Trigger actions
         * @memberOf Trigger
         * @name Trigger#actions
         * @public
         * @type {array}
         */
        self.actions = Utils.convertToArray(data, "action");

        /**
         * Trigger conditions
         * @memberOf Trigger
         * @name Trigger#conditions
         * @public
         * @type {array}
         */
        self.conditions = Utils.convertToArray(data, "condition");

        /**
         * Trigger events
         * @memberOf Trigger
         * @name Trigger#events
         * @public
         * @type {array}
         */
        self.events = Utils.convertToArray(data, "event");

        /**
         * Trigger name
         * @memberOf Trigger
         * @name Trigger#name
         * @public
         * @type {String}
         */
        self.name = Utils.validateName(data.name, "Trigger");
        var immediate = data.immediate === "true" || false;
        self.index = data.index;

        var loadDeferred = $.Deferred();
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		}

        self.timerIds = [];

        function validateConditions(eventArgs) {
            var validationResult = true;
            // Conditions are handled with AND operator
            // => each condition must be valid
            _.each(self.conditions, function (condition) {
                var operator = condition.operator;
				var values = Utils.convertToArray(condition, "value");
                var firstValue = values[0] ? component.resolveAndGetValue(values[0], eventArgs) : undefined;
                var secondValue = values[1] ? component.resolveAndGetValue(values[1], eventArgs) : undefined;
                if (!validateCondition(operator, firstValue, secondValue)) {
                    validationResult = false;
                }
            });
            return validationResult;
        }

        function validateCondition(operator, firstValue, secondValue) {
            var result = false;
            var firstValueInt, secondValueInt;
            switch (operator) {
            case 'eq':
                if (firstValue != null && secondValue != null && ("" + firstValue == "" + secondValue)) {
                    result = true;
                }
                break;
            case 'ne':
                if (firstValue != null && secondValue != null && ("" + firstValue != "" + secondValue)) {
                    result = true;
                }
                break;
            case 'gt':
                firstValueInt = parseFloat(firstValue);
                secondValueInt = parseFloat(secondValue);
                if (firstValueInt > secondValueInt) {
                    result = true;
                }
                break;
            case 'lt':
                firstValueInt = parseFloat(firstValue);
                secondValueInt = parseFloat(secondValue);
                if (firstValueInt < secondValueInt) {
                    result = true;
                }
                break;
            case 'isNull':
                if (firstValue == null) {
                    result = true;
                }
                break;
            case 'isNotNull':
                if (firstValue != null) {
                    result = true;
                }
                break;
            default:
                break;
            }
            return result;
        }

        function resolveActions() {
			var promises = [];
		
            _(self.actions).each(function (action) {
                promises.push(Action.resolveAction(action));
            });
			
            $.when.apply(window, promises).then(function () {
                Magicaster.console.log('[Trigger] actions resolved', self);
                loadDeferred.resolve();
            });
        }

        //
        // PUBLIC METHODS
        //

        /**
         * Sets trigger index within magicast node. Trigger should be launched according to their order in
         * XML.
         * @public
         * @method
         * @name Trigger#execute
         * @param index {Number} The "index" of trigger in the XML definition (= the order within node)
         */
        self.setIndex = function (index) {
            self.index = index || 0;
        };

        /**
         * Destroys trigger, so in addition to stopping it also clears possibly pending timeouts.
         * @public
         * @method
         * @name Trigger#destroy
         */
        self.destroy = function () {
            self.stop();
            _(self.timerIds).each(function (tid) {
                clearTimeout(tid);
            });
        };

        /**
         * Stops trigger aka unregisters event handlers.
         * @public
         * @method
         * @name Trigger#stop
         */
        self.stop = function () {
            // NOTE! Stop does not clear ongoing timers. For that purpose use destroy-method.
            Magicaster.console.log("[Trigger] stop", self);
            // Loop through each event and stop the listeners
            _(self.events).each(function (mcEvent) {
				if (mcEvent.destroy && typeof mcEvent.destroy === 'function') {
					mcEvent.destroy();
					delete mcEvent.destroy;
				}
            });
            started = false;
        };

		var started = false;
        /**
         * Trigger needs to be started explicitly.
         * Double-starts are not allowed.
         * @public
         * @method
         * @name Trigger#start
         */
        self.start = function () {
            // Check that no duplicate starts are done
            if (started) {
                return;
            }
            started = true;

			Magicaster.console.log("[Trigger] start");

            if (self.events) {
                _(self.events).each(function (mcEvent) {
					component.resolveAndBindEventListener(mcEvent, function(eventArgs, e) {
						// because event callbacks are not called in order, use Utils.callInOrder
						Utils.callInOrder(e.timeStamp * 1000 + self.index, function() {
							self.execute(eventArgs);
						});
					});
                });
            }
			
            if (immediate) {
				// wait for startup sequence to be finished before executing immediate actions
				setTimeout(function() {
					self.execute();
				}, 0);
				// trigger can be stopped and started multiple times, but run immediate triggers only once
				immediate = false;
            }			
        };

        /**
         * Executes trigger but validates possible conditions
         * @public
         * @method
         * @name Trigger#execute
         */
        self.execute = function (eventArgs) {
		
            // Trigger can have conditions to be validated.
            if (self.conditions.length && !validateConditions(eventArgs)) {
                Magicaster.console.log("[Trigger] execute, but conditions are not met", eventArgs);
                return;
            }

			Magicaster.console.log("[Trigger] execute", eventArgs);
			
            _(self.actions).each(function (action) {
                var method = action.method;
                var actionParams = action.parameters || {};
                var layerName = action.layer || null;
				
				// Cache Magicaster.findMagicastsByName
                if (!action.targetMagicasts) {
                    action.targetMagicasts = action.magicast ? Magicaster.findMagicastsByName(action.magicast) : component;
                    action.targetMagicasts = _.flatten([action.targetMagicasts]);
                }

                _(action.targetMagicasts).each(function (magicast) {
                    var time = action.wait * 1000 || 0;
                    if (time > 0) {
                        self.timerIds.push(setTimeout(function () {
                            Action.executeAction(method, actionParams, eventArgs, magicast, layerName);
                        }, time));
                    }
                    else {
                        Action.executeAction(method, actionParams, eventArgs, magicast, layerName);
                    }
                });
            });
		};

        //
        // EXECUTION
        //

        // Need to wait until all actions have been resolved to continue.
        resolveActions();
    }

    return Trigger;
});