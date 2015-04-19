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
		
		var magicasts = params.layer.magicast ? Magicaster.findMagicastsByName(params.layer.magicast) : [magicast];
		_.each(magicasts, function(magicast) {
			var layer = magicast.findLayerByName(params.layer.name);
			if (layer) {
				Magicaster.applyCdGroup(params.collisionDetectionGroup, layer);
			}
		});
    };

    return applyCollisionDetectionGroup;
});