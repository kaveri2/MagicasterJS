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

    function Box(data, layer) {
	
		var self = this;

		var loadDeferred = $.Deferred();
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		}
		
		var $content = layer.getContent();
		
		var backgroundImage;
		if (data.textureAsset) {
			backgroundImage = layer.resolveAndGetValue(data.textureAsset);
		} else if (data.data) {
			backgroundImage = layer.resolveAndGetValue(data.textureData);
		} else {
			loadDeferred.resolve();
		}
		
		if (backgroundImage) {
			var $image = $("<img />");
			$content.append($image);
			$image.attr({src: backgroundImage});
			$image.get(0).onload = function (e) {	
				$image.remove();
				$image = null;
				loadDeferred.resolve();
			};
			$image.get(0).onerror = function (e) {
				$image.remove();
				$image = null;
				loadDeferred.reject();
			};
		}
		
		var width;
		var widthSet = false;
		if (data.width) {
			width = parseFloat(layer.resolveAndGetValue(data.width));
			$content.width(width);
			widthSet = true;
		}
		var height;
		var heightSet = false;
		if (data.height) {
			height = parseFloat(layer.resolveAndGetValue(data.height));
			$content.height(height);
			heightSet = true;
		}
		
		self.adjust =  function(w, h, ar) {		
			if (!widthSet) {
				$content.width(w);
			}
			if (!heightSet) {
				$content.height(h);
			}
			layer.setGeometry({
				width: widthSet ? width : w,
				height: heightSet ? height : h
			});
		};		
		
		$content.css({
			"box-sizing": "border-box",
			"background-color": (data.color ? "" + layer.resolveAndGetValue(data.color) : undefined),
			"background-image": (backgroundImage ? backgroundImage : undefined),
			"background-position": (data.texturePosition ? "" + layer.resolveAndGetValue(data.texturePosition) : undefined),
			"border": (data.border ? "" + layer.resolveAndGetValue(data.border) : undefined),
			"border-radius": (data.borderRadius ? "" + layer.resolveAndGetValue(data.borderRadius) : undefined)
		});
		
    };

    return Box;
});
