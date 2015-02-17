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
     *  3. Update capabilityArray according to the existence of the capability.
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

        /**Array containing all resolved capabilities
         * @name Magicast#capabilities
         * @type {Array<String>}
         * @public
         */
        var capabilityArray = [];

        /**
         * Determine running platform capabilities.
         * @public
         * @method
         * @name Capabilities#detectCapabilities
         */
        function detectCapabilities() {
            Magicaster.console.log("[Capabilities] detectCapabilities");

            detectCameraSupport();
        }

        /**
         * Determine if running platform has webcam/camera support.
         */
        function detectCameraSupport() {
            capabilityArray["camera"] = (navigator.getUserMedia ||
                                         navigator.webkitGetUserMedia ||
                                         navigator.mozGetUserMedia ||
                                         navigator.msGetUserMedia) ? true : false;

            Magicaster.console.log("Camera support: " + capabilityArray["camera"]);
        }

        /**
         * Validate requirements against capabilities of the running platform.
         * @public
         * @method
         * @name Capabilities#validateRequirements
         * @param requirementsArray {Array<String>} Required capabilities
         * @param failedRequirements {Array<String>} Returning list of requirements that have not been met.
         * @returns {Boolean} true, if requirements are according to device capabilities
         *                    false, if requirements can not be fulfilled
         */
        function validateRequirements(requirementsArray, failedRequirements) {
            Magicaster.console.log("[Capabilities] validateRequirements", requirementsArray);

            if (requirementsArray && requirementsArray.length) {
                return _.every(requirementsArray, function(requirement) {
                    var supported = capabilityArray[requirement];
                    if (!supported && failedRequirements) {
                        failedRequirements.push(requirement);
                    }
                    return supported;
                });
            }
            else {
                return true;
            }
        }

        return {
            capabilities: capabilityArray,
            detectCapabilities: detectCapabilities,
            validateRequirements: validateRequirements
        };

    })();

    return Capabilities;
});