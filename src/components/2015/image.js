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

	return function(data, layer) {
	
		var self = this;

		var loadDeferred = $.Deferred();
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		}

		var $content = layer.getContent();
		// make the image fit layer's dimensions
		var $image = $("<img draggable='false' style='position: absolute'>");
		$content.append($image);
		
		if (data.asset) {
			$image.attr({src: layer.resolveAndGetValue(data.asset)});
		} else if (data.data) {
			$image.attr({src: layer.resolveAndGetValue(data.data)});
		} else {
			loadDeferred.resolve();
		}

		$image.get(0).onload = function (e) {		
			layer.setGeometry({
				width: $image.get(0).naturalWidth,
				height: $image.get(0).naturalHeight
			});
			loadDeferred.resolve();
		};

		$image.get(0).onerror = function (e) {
			loadDeferred.reject();
		};

		self.control = function(method, parameters, eventArgs) {
			if (method=="setData") {
				$image.attr({src: layer.resolveAndGetValue(parameters.value, eventArgs)});
			}
			if (method=="setAsset") {
				$image.attr({src: layer.resolveAndGetValue(parameters.value, eventArgs)});
			}
		};
		
	}
	
});