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
	
	function Text(data, layer) {

		Magicaster.console.log("[Text]", data, layer);

		var self = this;
		
		var scale = layer.resolveAndGetValue(data.scale);
		if (scale == "true") scale = "both";
		if (!scale || scale == "false") scale = "none";
		var wordWrap = layer.resolveAndGetValue(data.wordWrap) === "true";
		
		var $content = layer.getContent();
		$content.css({
			"position": "relative",
			"font-family": (data.fontFamily ? layer.resolveAndGetValue(data.fontFamily) : undefined),
			"font-size": (data.fontSize ? "" + layer.resolveAndGetValue(data.fontSize) : undefined),
			"color": (data.color ? "" + layer.resolveAndGetValue(data.color) : undefined),
			"text-align": (data.align ? "" + layer.resolveAndGetValue(data.align) : undefined),
			"line-height": (data.lineHeight ? "" + layer.resolveAndGetValue(data.lineHeight) : undefined),
			"letter-spacing": (data.letterSpacing ? "" + layer.resolveAndGetValue(data.letterSpacing) : undefined),
			"decoration": (data.decoration ? "" + layer.resolveAndGetValue(data.decoration) : undefined)
		});

		var $text = $("<span></span>");

		$text.css({
			"display": "inline-block",
			"text-align": "inherit",
			"-webkit-user-select": "inherit",
			"-khtml-user-select": "inherit",
			"-moz-user-select": "inherit",
			"-ms-user-select": "inherit",
			"user-select": "inherit"
		});
		$content.append($text);
				
		var nativeGeometry;
		var nativeAspectRatio;
		function calculateNativeGeomerty() {
			$text.css({
				"white-space": "pre",
				"width": "auto"
			});
			nativeGeometry = {
				width: $text.outerWidth(true),
				height: $text.outerHeight(true)
			};
			nativeAspectRatio = nativeGeometry.width / nativeGeometry.height;
			$text.css({
				"white-space": (wordWrap ? "pre-wrap" : "pre")
			});
		}
		
		function setText(text) {
			text = text || "";
			text = text.toString();
			var regExp = new RegExp("<br\\s*/>", "gi");
			text = text.replace(regExp, "\n");
			$text.html(text);
			calculateNativeGeomerty();
			layer.dirty = true;
		}

		self.start = function() {
			setText(layer.resolveAndGetValue(data.text));
		};
					
		self.adjust =  function(width, height, aspectRatio) {					
			var geometry;
			if (wordWrap) {
				var ratio = (width !==undefined && height !== undefined ? width / height : (aspectRatio ? aspectRatio : undefined));
				var clever = false;
				if (ratio && scale !== "none" && scale !== "up") {
					calculateNativeGeomerty();
					// use clever width adjustment if native shape is wider than target shape
					if (ratio < nativeAspectRatio) {
						clever = true;
						var attempts = 0;
						var low = ratio / nativeAspectRatio;
						var high = 1;
						var r_high = nativeAspectRatio;
						while (attempts < 3) {
							$text.outerWidth(nativeGeometry.width * low);
							var r_low = $text.outerWidth(true) / $text.outerHeight(true);
							if (Math.abs(r_high - ratio) < Math.abs(r_low - ratio)) {
								low = (low + low + high) / 3;
							} else {
								high = (low + high + high) / 3;
								$text.outerWidth(nativeGeometry.width * high);
								r_high = $text.outerWidth(true) / $text.outerHeight(true);
							}
							attempts++;
						}
						$text.outerWidth(nativeGeometry.width * high);
					}
				}
				if (!clever) {
					if (scale !== "none" && scale !== "up") {
						$text.outerWidth(nativeGeometry.width);
					}
					else {
						$text.outerWidth(Math.min(nativeGeometry.width, width ? width : 0));
					}
				}
				geometry = {
					width: $text.outerWidth(true),
					height: $text.outerHeight(true)
				};
			} else {
				geometry = nativeGeometry;				
			}

			// tell magicast the real dimensions so it can scale the content
			var scaleX = false;
			var scaleY = false;
			if (scale == "both" ||
				(scale == "up" && (width!=undefined && geometry.width < width)) ||
				(scale == "down" && (width!=undefined && geometry.width > width))) {
				scaleX = true;
			}
			if (scale == "both" ||
				(scale == "up" && (height!=undefined && geometry.height < height)) ||
				(scale == "down" && (height!=undefined && geometry.height > height))) {
				scaleY = true;
			}
						
			// maybe lie to magicast that text already fits the requested dimensions
			layer.setGeometry({
				width: (scaleX ? geometry.width : (width ? width : nativeGeometry.width)),
				height: (scaleY ? geometry.height : (height ? height : nativeGeometry.height))
			});
		};

		self.control = function (method, parameters, eventArgs) {
			if (method=="setText") {
				setText(layer.resolveAndGetValue(parameters.value, eventArgs));
			}
		};
		
    }

    return Text;
});