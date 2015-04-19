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
        self.name = Utils.validateName(data.name, "Trigger");
        var immediate = data.immediate === "true" || false;
        self.index = data.index;

        var loadDeferred = $.Deferred();
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		}

        self.timerIds = [];

        function resolveActions() {
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
            _(events).each(function (event) {
				if (event.unbindEventListener && typeof event.unbindEventListener === 'function') {
					event.unbindEventListener();
					delete event.unbindEventListener;
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

			Magicaster.console.log("[Trigger] start", self);
		
			// unbind and bind event listeners, to make trigger work in the correct order
			self.stop();
			_(events).each(function (event) {
				event.unbindEventListener = magicast.resolveAndBindEventListener(event, function(eventArgs, e) {
					self.execute(eventArgs);
				});
			});
		
            // Check that no duplicate starts are done
            if (started) {
                return;
            }
            started = true;

			Magicaster.console.log("[Trigger] start");

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
		
            if (condition && !magicast.resolveAndGetValue(condition, eventArgs)) {
                Magicaster.console.log("[Trigger] execute, but conditions are not met", self, eventArgs);
                return;
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
					if (action && (!data.condition || magicast.resolveAndGetValue(data.condition, eventArgs))) {
					
						// cache Magicaster.findMagicastsByName
						if (!action.targetMagicasts) {
							action.targetMagicasts = data.magicast ? Magicaster.findMagicastsByName(magicast.resolveAndGetValue(data.magicast, eventArgs)) : magicast;
							action.targetMagicasts = _.flatten([action.targetMagicasts]);
						}

						_(action.targetMagicasts).each(function (magicast) {
							action.call(null, magicast, data.parameters, eventArgs);
						});
					}
				}
				
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
