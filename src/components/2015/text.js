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
		
		var $content = layer.getContent();
		var $text = $("<span></span>");
		$content.append($text);
		
		var scale = layer.resolveAndGetValue(data.scale);
		if (scale == "true") scale = "both";
		if (!scale || scale == "false") scale = "none";
		var wordWrap = layer.resolveAndGetValue(data.wordWrap) === "true";
		var clip = layer.resolveAndGetValue(data.clip) !== "false";

		var color = layer.resolveAndGetValue(data.color);
		var fontFamily = layer.resolveAndGetValue(data.fontFamily);
		var fontSize = layer.resolveAndGetValue(data.fontSize);
		var align = layer.resolveAndGetValue(data.align);
		var lineHeight = layer.resolveAndGetValue(data.lineHeight);
		var letterSpacing = layer.resolveAndGetValue(data.letterSpacing);
		var decoration = layer.resolveAndGetValue(data.decoration);
		
		$content.css({
			"position": "relative",
			"overflow": clip ? "hidden" : "visible",
			"width": "100%",
			"height": "100%",
		});
		
		var nativeGeometry;
		var nativeAspectRatio;
		function setText(text) {
			$text.css({
				"display": "inline-block",
				"white-space": "pre",
				"font-family": (fontFamily ? fontFamily : "inherit"),
				"font-size": (fontSize ? "" + fontSize : "inherit"),
				"color": (color ? "" + color : "inherit"),
				"line-height": (lineHeight ? "" + lineHeight : "inherit"),
				"text-align": (align ? "" + align : "inherit"),
				"letter-spacing": (letterSpacing ? "" + letterSpacing : "inherit"),
				"decoration": (decoration ? "" + decoration : "inherit")
			});
			text = text || "";
			text = text.toString();
			var regExp = new RegExp("<br\\s*/>", "gi");
			text = text.replace(regExp, "\n");
			$text.html(text);
			nativeGeometry = {
				width: $text.outerWidth(true),
				height: $text.outerHeight(true)
			};
			nativeAspectRatio = nativeGeometry.width / nativeGeometry.height;
			$text.css({
				"position": "absolute",
				"display": "inline-block",
				"white-space": (wordWrap ? "pre-wrap" : "pre"),
				"font-family": (fontFamily ? fontFamily : "inherit"),
				"font-size": (fontSize ? "" + fontSize + "px" : "inherit"),
				"color": (color ? "" + color : "inherit"),
				"line-height": (lineHeight ? "" + lineHeight : "inherit"),
				"align": (align ? "" + align : "inherit"),
				"letter-spacing": (letterSpacing ? "" + letterSpacing : "inherit"),
				"decoration": (decoration ? "" + decoration : "inherit")
			});
		}

		self.start = function() {
			setText(layer.resolveAndGetValue(data.text));
		};
					
		self.adjust =  function(width, height, aspectRatio) {		
		
			var geometry = nativeGeometry;
			
			if (wordWrap) {
				var ratio = (width !==undefined && height !== undefined ? width / height : (aspectRatio ? aspectRatio : undefined));
				// use clever width adjustment if native shape is wider than target shape
				if (ratio && ratio < nativeAspectRatio && scale !== "none" && scale !== "up") {
					var attempts = 0;
					var low = ratio / nativeAspectRatio;
					var high = 1;
					var result = high;
					while (attempts < 3) {
						$text.width(geometry.width * (low + high) / 2);
						var r = $text.outerWidth(true) / $text.outerHeight(true);
						if (ratio < r) {
							low = ratio / r; 
						} else {
							result = high = ratio / r;
						}
						attempts++;
					}
				}
				else {
					if (scale !== "none" && scale !== "up") {
						$text.width(geometry.width);
					}
					else {
						$text.width(Math.min(geometry.width, width ? width : 0));
					}
				}
				geometry = {
					width: $text.outerWidth(true),
					height: $text.outerHeight(true)
				};
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