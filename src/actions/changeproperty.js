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

    var method = function changeProperty(params, eventArgs, magicast) {
        Magicaster.console.log("[actions/changeProperty]", params, eventArgs, magicast);

        var magicasts = params.property.magicast ? Magicaster.findMagicastsByName(params.property.magicast) : [magicast];
        _.each(magicasts, function (magicast) {
			var layers = Utils.convertToArray(params.property, "layer");
            _(layers).each(function(layer){
                var l = magicast.findLayerByName(layer);
                if (l) {
                    var name = params.property.name;
                    var value = magicast.resolveAndGetValue(params.value, eventArgs);					
                    var ease = params.ease;
                    var time = params.time;
                    var callback = params.completeEvent ? function () {
                        magicast.resolveAndTriggerEvent(params.completeEvent, eventArgs);
                    } : null;
                    magicast.layout.changeProperty(l, name, value, ease, time, callback);
                }
            });
        });
    };

    return method;
});