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
     * Action singleton for handling Magicast actions
     * @namespace  Action
     */
    var Action = (function () {

        var actionBasePath = "actions/";
        var publicActionPrefix = "magiacster_magicastAction";
        var actions = [];
        var counter = 0;

        /**
         * Default action implementation in case resolving specific action fails.
         * Calls component's action and action_[method], if layer is specified.
		 * Always dispatches public event of the action.
         * @name Action#defaultAction
         * @private
         * @method
         * @param method {String} Action method name
         * @param parameters {Object} Action parameters
         * @param eventArgs {Object} Event arguments
         * @param magicast {Object} Magicast object
         * @param layerName {String} Name of the target layer
         * @returns {Boolean} Success code of the action resolving
         */
        function defaultAction(method, parameters, eventArgs, magicast, layerName) {
			var elem;
			var publicActionData;
			
			// Default action works only on layer level actions
            if (magicast && layerName) {
                if (layerName) {
					var layer = magicast.findLayerByName(layerName);
					if (layer) {
				
						// Call component's implementation
						var component = layer.getComponent();
						if (component) {
							if (component.action) {
								component.action(method, parameters, eventArgs);
							}
							if (component['action_' + method]) {
								component['action_' + method].call(null, parameters, eventArgs);
							}
						}

						// Dispatch public event (documented below)
                        elem = layer.getContainer()[0]; // DOM target
                        publicActionData = {
							'method': method,
                            'parameters': parameters,
                            'eventAgruments': eventArgs,
                            'magicast': magicast,
                            'layer': layer
                        };
                        Utils.dispatchEvent(publicActionPrefix + '_' + method, publicActionData, elem);
                        Utils.dispatchEvent(publicActionPrefix, publicActionData, elem);
                        return true;
                    }
                    else {
                        Magicaster.console.error("[Action] Target layer (" + layerName + ") not found!");
                        return false;
                    }
                }
			}
			// Magicast and global level actions only dispatch public event
			else {
			
				elem = magicast.$root[0]; // DOM target
				publicActionData = {
					'method': method,
					'parameters': parameters,
					'eventArguments': eventArgs,
					'magicast': magicast
				};
				
				/**
				 * Raised for unresolved Magicast actions and layer-specific actions. Event is dispatched to
				 * either target Object or then to target layer, but events can be listened from document due to
				 * bubbling.
				 *
				 * Example of real fired action method is e.g. "magicaster_magicastAction_requestFullScreen".
				 *
				 * @event
				 * @name magicaster_magicastAction_[method]
				 * @param method {Object} Action method
				 * @param parameters {Object} Action parameters
				 * @param eventArgs {Object} Arguments of the event that triggered the action
				 * @param magicast {Object} Reference to Object instance. Not defined with global actions.
				 * @param layerName {String} Layer name if Magicast action is layer action. Otherwise layerName is not defined.
				 */
				Utils.dispatchEvent(publicActionPrefix + '_' + method, publicActionData, elem);

				/**
				 * Raised for unresolved Magicast actions and layer-specific actions. Event is dispatched to
				 * either target Object or then to target layer, but events can be listened from document due to
				 * bubbling.
				 * @event
				 * @name magicaster_magicastAction
				 * @param method {Object} Action method
				 * @param parameters {Object} Action parameters
				 * @param eventArgs {Object} Arguments of the event that triggered the action
				 * @param magicast {Object} Reference to Object instance. Not defined with global actions.
				 * @param layerName {String} Layer name if Magicast action is layer action. Otherwise layerName is not defined.
				 */
				Utils.dispatchEvent(publicActionPrefix, publicActionData, elem);
			}
        }

        /**
         * Method to resolve actions before executing them. Actions are defined in JS files
         * within base path and loaded with RequireJS.
         * Layer actions are handled using the defaultAction implementation. In practice this means that
         * action is triggered as an event to the layer.
         * @name Action#resolveAction
         * @public
         * @method
         * @param actionData {Object} Action data containing the information about the action to be resolved
         * @returns {Promise} Promise, which is resolved with action implementation function.
         */
        function resolveAction(actionData) {
            Magicaster.console.log("[Action] resolveAction", actionData);
            var d = $.Deferred();
            var method = actionData.method;
            if (actions[method] && typeof actions[method] === 'function') {
                d.resolve(actions[method]);
            }
            else if (actionData.layer) {
                // It's layer action, so use defaultAction implementation
                actions[method] = defaultAction;
                d.resolve(defaultAction);
            }
            else {
                try {
                    require([actionBasePath + method.toLowerCase()],
						function (action) {
                            if (typeof action === 'function') {
                                Magicaster.console.log("[Action] resolved: " + method);
                                actions[method] = action;
                                d.resolve(action);
                            }
                            else {
                                Magicaster.console.error("[Action] resolve error: not a function");
                                actions[method] = defaultAction;
                                d.resolve(defaultAction);
                            }
                        },
                        function () {
                            Magicaster.console.error("[Action] resolve error: action not found");
                            actions[method] = defaultAction;
                            d.resolve(defaultAction);
                        });
                }
                catch (e) {
                    Magicaster.console.error("[Action] resolveAction exception", e);
                    actions[method] = defaultAction;
                    d.resolve(defaultAction);
                }
            }
            return d.promise();
        }

        /**
         * Executes action according to the name
         * @name Action#executeAction
         * @public
         * @method
         * @param method {String} Name of the action
         * @param parameters {Object} Actual action parameters
         * @param eventArgs {Object} Event arguments
         * @param magicast {Object} Action's target Magicast
         * @param layerName {String} Name of the target layer
         * @returns {Boolean} Success code of the action call
         */
        function executeAction(method, parameters, eventArgs, magicast, layerName) {
            var action = actions[method];
            if (action && typeof action === 'function') {
				if (action == defaultAction) {
					return defaultAction(method, parameters, eventArgs, magicast, layerName);
				} else {
					return action.call(Action, parameters, eventArgs, magicast, layerName);
				}
            }
            else {
                Magicaster.console.error("[Aaction] Action not found, executing default action instead");
                return defaultAction(method, parameters, eventArgs, magicast, layerName);
            }
        }

        /**
         * Registers new (Magicast/Node) action to the Action singleton.
         * Can be used by e.g. components to register component-specific actions
         * @name Action#registerAction
         * @public
         * @method
         * @param method {String} Name of the action
         * @param action {Function} Action implementation function object
         */
        function registerAction(method, action) {
            Magicaster.console.log("[Action] registerAction: " + method);
            if (action && typeof action === 'function') {
                actions[method] = action;
            }
        }

        return {
            resolveAction: resolveAction,
            executeAction: executeAction,
            registerAction: registerAction
        };

    })();

    return Action;
});