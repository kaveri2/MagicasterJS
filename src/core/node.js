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
     * Node is an instance of a Magicast node.
     * @class
     * @name Node
     */
    function Node(data, magicast, refresh) {
        if (!(this instanceof Node)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }

        //
        // DEFINITIONS
        //

        var self = this;

        /**
         * Node name
         * @memberOf Node
         * @name Node#name
         * @public
         * @type {String}
         */
        self.name = null;

        var loadDeferred = $.Deferred();
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		};

        //
        // LOCAL FUNCTIONS
        //

        function processData(data) {

            self.name = Utils.validateName(data.name, "Node");

            self.properties = Utils.convertToArray(data, "property");
            self.properties = Utils.convertArrayToKeyValue(self.properties, "name", "value");

            var layers = Utils.convertToArray(data, "layer");
            magicast.createLayers(layers, refresh);

            var triggers = Utils.convertToArray(data, "trigger");
            magicast.createTriggers(triggers, refresh);
        }

        //
        // EXECUTION
        //

        processData(data);

        var a = [];
        _.each(magicast.getLayers(), function (layer) {
            a.push(layer.getLoadPromise());
        });
        _.each(magicast.getTriggers(), function (trigger) {
            a.push(trigger.getLoadPromise());
        });
        $.when.apply(window, a).then(function () {
			Magicaster.console.log('[Node] layers and triggers resolved', self);
            loadDeferred.resolve();
        });		
    }

    return Node;
});