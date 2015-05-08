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

define(["jquery", "utils/utils"], function ($, Utils) {
    "use strict";

    /**
     * Trigger is an instance of a Magicast trigger.
     * @class
     * @name Trigger
     */
    function Trigger(data, magicast) {
        /** @lends Trigger **/
        if (!(this instanceof Trigger)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }

        if (!data) {
            throw new TypeError("Invalid parameter");
        }
		
        var self = this;

        var events = Utils.convertToArray(data, "event");
        var actions = Utils.convertToArray(data, "action");
        var condition = data.condition;

        /**
         * Trigger name
         * @memberOf Trigger
         * @name Trigger#name
         * @public
         * @type {String}
         */
        self.name = Utils.validateName(magicast.resolveAndGetValue(data.name), "Trigger");
        var immediate = magicast.resolveAndGetValue(data.immediate) == "true";
        self.index = data.index;

        self.timerIds = [];

        //
        // PUBLIC METHODS
        //

        /**
         * Sets trigger index within magicast node. Trigger should be launched according to their order in
         * XML.
         * @public
         * @method
         * @name Trigger#setIndex
         * @param index {Number} The "index" of trigger in the XML definition (= the order within node)
         */
        self.setIndex = function (index) {
            self.index = index || 0;
        };

        /**
         * Destroys trigger, so in addition to unbinding event listeners it also clears possibly pending timeouts.
         * @public
         * @method
         * @name Trigger#destroy
         */
        self.destroy = function () {
            self.unbindEventListeners();
            _(self.timerIds).each(function (tid) {
                clearTimeout(tid);
            });
        };

        /**
         * @public
         * @method
         * @name Trigger#unbindEventListeners
         */
        self.unbindEventListeners = function() {
            // NOTE! Does not clear ongoing timers. For that purpose use destroy-method.
            Magicaster.console.log("[Trigger] unbindEventListeners", self);
            _(events).each(function (event) {
				if (event.unbindEventListener && typeof event.unbindEventListener === 'function') {
					event.unbindEventListener();
					delete event.unbindEventListener;
				}
            });
        };

        /**
         * @public
         * @method
         * @name Trigger#bindEventListeners
         */
        self.bindEventListeners = function () {
			Magicaster.console.log("[Trigger] bindEventListeners", self);
			self.unbindEventListeners();
			_(events).each(function (event) {
				event.unbindEventListener = magicast.resolveAndBindEventListener(event, function(eventArgs, e) {
					self.execute(eventArgs);
				});
			});
        };
		
        /**
         * Trigger needs to be started explicitly.
         * @public
         * @method
         * @name Trigger#start
         */
		self.start = function () {
			Magicaster.console.log("[Trigger] start", self);
			
            if (immediate) {
				// wait for startup sequence to be finished before executing immediate actions
				self.execute();
				// trigger can be stopped and started multiple times, but run immediate triggers only once
				immediate = false;
            }			
		}

        /**
         * Executes trigger but validates possible conditions
         * @public
         * @method
         * @name Trigger#execute
         */
        self.execute = function (eventArgs) {
		
            if (condition) {
				var b = magicast.resolveAndGetValue(condition, eventArgs);
				if (b === null || b === false || b === 0 || b === "false") {
					Magicaster.console.log("[Trigger] execute, but conditions are not met", self, eventArgs);
					return;
				}
            }

			Magicaster.console.log("[Trigger] execute", self, eventArgs);
			
			_(actions).each(function (data) {
			
				var time = 0;
				if (data.wait) {
					time = magicast.resolveAndGetValue(data.wait, eventArgs) * 1000;
				}

				if (time > 0) {
					self.timerIds.push(setTimeout(function () {
						run();
					}, time));
				}
				else {
					run();
				}				
				
				function run() {
					var url = magicast.resolveAndGetValue(data.asset, eventArgs);
					var action = Magicaster.actions[url];
					if (action) {
						var b = true;
						if (data.condition) {
							b = magicast.resolveAndGetValue(data.condition, eventArgs);
							if (b === null || b === false || b === 0 || b === "false") {
								b = false;
							}
						}
						if (b) {
							try {
								action.call(null, magicast, data.parameters, eventArgs);
							} catch (e) {
								Magicaster.console.error("[Trigger] action exception", action, e);
							}
						}
					}
				}
				
			});

			
		};

		// Need to wait until all actions have been resolved to continue
        var loadDeferred = $.Deferred();
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		}
		
		var promises = [];
			
		_(actions).each(function (data) {
			var d = $.Deferred();
			var url = magicast.resolveAndGetValue(data.asset);
			if (Magicaster.actions[url] && typeof Magicaster.actions[url] === 'function') {
				d.resolve();
			}
			else {
				try {
					require([url],
						function (action) {
							if (typeof action === 'function') {
								Magicaster.console.log("[Trigger] action resolved", url, action);
								Magicaster.actions[url] = action;
								d.resolve();
							}
							else {
								Magicaster.console.error("[Trigger] action resolve error: not a function", url, action);
								Magicaster.actions[url] = function() {};
								d.resolve();
							}
						},
						function () {
							Magicaster.console.error("[Trigger] action resolve error: action not found", url);
							Magicaster.actions[url] = function() {};
							d.resolve();
						});
				}
				catch (e) {
					Magicaster.console.error("[Trigger] action resolve error: exception", url, e);
					Magicaster.actions[url] = function() {};
					d.resolve();
				}
			}
	
			promises.push(d.promise());
		});
		
		$.when.apply(window, promises).then(function () {
			Magicaster.console.log('[Trigger] actions resolved', self);
			loadDeferred.resolve();
		});
				
	}

    return Trigger;
});
