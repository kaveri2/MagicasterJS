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

define(["utils/utils"], function (Utils) {
    "use strict";

	function changeProperty(magicast, params, eventArgs) {
        Magicaster.console.log("[actions/changeProperty]", magicast, params, eventArgs);

        var magicasts = params.property.magicast ? Magicaster.findMagicastsByName(magicast.resolveAndGetValue(params.property.magicast, eventArgs)) : [magicast];
        _.each(magicasts, function (magicast) {
			var l = magicast.findLayerByName(magicast.resolveAndGetValue(params.property.layer, eventArgs));
			if (l) {
				var name = magicast.resolveAndGetValue(params.property.name, eventArgs);
				var value = magicast.resolveAndGetValue(params.value, eventArgs);					
				var ease = magicast.resolveAndGetValue(params.ease, eventArgs);					
				var time = magicast.resolveAndGetValue(params.time, eventArgs);					
				var callback = params.completeEvent ? function () {
					magicast.resolveAndTriggerEvent(params.completeEvent, eventArgs);
				} : null;
				magicast.layout.changeProperty(l, name, value, ease, time, callback);
			}
        });
    };

    return changeProperty;
});