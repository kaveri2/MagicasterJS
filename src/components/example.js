/**
 * @preserve Copyright (c) 2013 Yleisradio (YLE)
 * (http://www.yle.fi) and MagicastJS Contributors (1)
 *
 * (1) MagicastJS Contributors are listed in the AUTHORS file.
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

define(["jquery"], function ($) {
    "use strict";

	Magicaster.console.log("[Component] loaded");
	
    /**
     * Component is an instance of an example component.
	 * @class
	 * @name Component
     * @param data {Object} Component's data from XML
     * @param layer {Layer} Reference to layer object
     */
	function Component(data, layer) {
        /** @lends Component **/
        if (!(this instanceof Component)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }
		
		Magicaster.console.log("[Component] created", data, layer);

		var self = this;
		
		var $content = layer.getContent();
		
		layer.setGeometry({
			width: 100,
			height: 100
		});
	
		var loadDeferred = $.Deferred();
		loadDeferred.resolve();
        /**
         * Returns the loadPromise, which is used in determining when the component is ready,
		 * usually meaning it has loade all required assets.
		 * If not implemented, the component is assumed to be instantly ready.
         * @name Component#getLoadPromise
         * @public
         * @method
         * @returns {promise}
         */
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		};
		
        /**
         * Returns an array defining component's requirements.
         * @name Component#getRequirements
         * @public
         * @method
         * @returns {Array}
         */
		 self.getRequirements = function() {
			return [];
		};
		
        /**
         * Starts the component. Called when layer is started, when node starts.
         * @name Component#start
         * @public
         * @method
         */
		 self.start = function() {
			Magicaster.console.log("[Component] start");
		};
		
        /**
         * Ticks the component. Called on each animationFrame.
         * @name Component#tick
         * @public
         * @method
         * @param time {Number} Time difference from last tick
         */
		self.tick = function(time) {
//			Magicaster.console.log("[Component] tick", time);
		};
		
        /**
         * Adjusts the component to fit target dimensions.
		 * The implementation should modify component's physical dimensions and then call layer.setGeometry.
         * @name Component#adjust
         * @public
         * @method
         * @param width {Number} Target width, null if not specified
         * @param height {Number} Target height, null if not specified
         * @param aspectRatio {Number} Target aspect ratio, null if not specified
         */
		self.adjust = function(width, height, aspectRatio) {
			Magicaster.console.log("[Component] adjust");
			layer.setGeometry({
			    width: 100,
				height: 100
            });
		};
		
        /**
         * Renders the component.
		 * It is preferred not to implement the method at all, in which case rendering
		 * if done using MCLayout's default rendering implementation. If the implementation 
		 * is required, it can get values from layer.getPropertis() and layer.getCalculations()
         * @name Component#render
         * @public
         * @method
         */
		 self.render = function() {
			Magicaster.console.log("[Component] render");
		};
		
        /**
         * Destroys the component. Called when layer is destroyed.
         * @name Component#destroy
         * @public
         * @method
         */
		 self.destroy = function() {
			Magicaster.console.log("[Component] destroy");
		};
		
    }

    return Component;
});