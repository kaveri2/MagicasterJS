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

    /**
     * doExampleAction is an example action
	 * @class
	 * @name doExampleAction
     * @param magicast {Magicast} Reference to magicast object
     * @param params {Object} Parameters from XML
     * @param eventArgs {Object} Event's arguments
     */
	function doExampleAction(magicast, params, eventArgs) {
        /** @lends Action **/
        if (!(this instanceof Action)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }
    }

    return doExampleAction;
});