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

define(["jquery", "utils/utils"], function ($, Utils) {
    "use strict";

	Magicaster.console.log("[Cache] loaded");
	
	function Cache(data, layer) {
        /** @lends Example **/
        if (!(this instanceof Cache)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }
		
		Magicaster.console.log("[Cache] created", data, layer);

		var loadDeferred = $.Deferred();
		
		var assetPromises = [];
		
		var assets = Utils.convertToArray(params, "asset");
		_(assets).each(function(assets) {
			var url = layer.resolveUriFromAsset(asset);
			var assetDeferred = $.Deferred();
			assetPromises.push(assetDeferred.promise());
			$.get(url).always(function() {
				assetDeferred.resolve();
			});
		});
		
		$.when.apply(window, assetPromises).then(function () {
			loadDeferred.resolve();
		});
		
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		};
		
    }

    return Cache;
});