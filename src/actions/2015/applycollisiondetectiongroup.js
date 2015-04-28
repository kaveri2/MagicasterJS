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

    function applyCollisionDetectionGroup(magicast, params, eventArgs) {
        Magicaster.console.log("[actions/applyCollisionDetectionGroup]", params, magicast);
		var layer = magicast.findLayerByName(magicast.resolveAndGetValue(params.layer, eventArgs));
		if (layer) {
			Magicaster.applyCdGroup(magicast, layer, 
				magicast.resolveAndGetValue(params.global, eventArgs) == "true", 
				magicast.resolveAndGetValue(params.name, eventArgs), 
				magicast.resolveAndGetValue(params.source, eventArgs) == "true", 
				magicast.resolveAndGetValue(params.target, eventArgs) == "true");
		}
    };

    return applyCollisionDetectionGroup;
});