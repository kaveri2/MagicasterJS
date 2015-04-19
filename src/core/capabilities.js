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

define(function () {
    "use strict";

    /**
     * Capabilities singleton for detecting the capabilities of the running platform. Also provides
     * support to validate the Magicast requirements against the supported capabilities.
     * Note! Currently following capability definitions are supported:
     *
     *  - "camera"
     *
     * This singleton implementation will be enhanced to support new capabilities.
     * In practice the enhancing is done with following steps:
     *
     *  1. Define the constant for the required capability
     *
     *  2. Implement the capability detection algorithm
     *
     *  3. Update capabilities according to the existence of the capability.
     *
     * Capability requirements are defined in 2 levels:
     *
     *  1. Magicast XML can contain <requirement> -XML tag(s).
     *
     *  2. Magicast component implementation can require existence of certain capability/capabilities.
     *
     * @namespace  Capabilities
     */
    var Capabilities = (function () {

        var capabilities = {};

        /**
         * Determine running platform capabilities.
         * @public
         * @method
         * @name Capabilities#detectCapabilities
         */
        function detectCapabilities() {
            Magicaster.console.log("[Capabilities] detectCapabilities");
			
            capabilities["camera"] = (navigator.getUserMedia ||
                                         navigator.webkitGetUserMedia ||
                                         navigator.mozGetUserMedia ||
                                         navigator.msGetUserMedia) ? true : false;
										 
			capabilities["Android"] = capabilities["iPhone"] = capabilities["iPod"] = capabilities["iPad"] = capabilities["WP"] = 0;
										 
			if ((navigator.userAgent.match(/Android/i))) { capabilities["Android"] = 1; }
			if ((navigator.userAgent.match(/iPhone/i))) { capabilities["iPhone"] = 1; }
			if ((navigator.userAgent.match(/iPod/i))) { capabilities["iPod"] = 1; }
			if ((navigator.userAgent.match(/iPad/i))) { capabilities["iPad"] = 1; }
			if ((navigator.userAgent.match(/IEMobile/i))) { capabilities["WP"] = 1; }

			capabilities["iOS"] = capabilities["iPad"] || capabilities["iPod"] || capabilities["iPad"];
			
			capabilities["video"] = !capabilities["iPad"] && !capabilities["iPod"];
		}

        /**
         * Validate requirements against capabilities of the running platform.
         * @public
         * @method
         * @name Capabilities#validateRequirements
         * @param requirements {Array} Required capabilities
         * @param failed {Array} Returning requirements that failed
         * @returns {Boolean} true, if requirements are according to device capabilities
         *                    false, if requirements can not be fulfilled
         */
        function validateRequirements(requirements, failed) {
            Magicaster.console.log("[Capabilities] validateRequirements");

            if (requirements && requirements.length) {
                return _.every(requirements, function(requirement) {
                    var supported = capabilities[requirement];
                    if (!supported && failed) {
                        failed.push(requirement);
                    }
                    return supported;
                });
            }
            else {
                return true;
            }			
        }
		
        /**
         * Get capabilities of the running platform
         * @public
         * @method
         * @name Capabilities#getCapabilities
         * @returns {Array} Device capabilities
         */
		function getCapabilities() {
			return capabilities;
		}

        return {
            detectCapabilities: detectCapabilities,
            validateRequirements: validateRequirements,
			getCapabilities: getCapabilities
        };

    })();

    return Capabilities;
});