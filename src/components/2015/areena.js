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

	Magicaster.console.log("[Areena] loaded");
	
	function Areena(data, layer) {

		if (!(this instanceof Areena)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }
		
		Magicaster.console.log("[Areena] created", data, layer);

		var self = this;
		
		var $content = layer.getContent();
		$content.width(640);
		$content.height(390);
		
		var $container = $('<div></div>');
		$content.append($container);
		
		var id = data.id;
		var startTime = data.startTime !== undefined ? parseFloat(data.startTime) : undefined;
		var endTime = data.endTime !== undefined ? parseFloat(data.endTime) : undefined;
		var controls = data.controls !== "false";
		var cue = Utils.convertToArray(data, "cue");
		var loop = data.loop === "true";
		var preview = data.preview !== "false";
		var paused = data.paused === "true";
		var volume = data.volume !== undefined ? parseFloat(data.volume) : 100;
				
		var manualPlay = false;
		var manualPause = false;
			
		var loadDeferred = $.Deferred();
		
		function createPlayer() {
			player = flowplayer($container.get(0));
			if (player) {
				if (player.isLoaded()) {
					if (startTime) {
						player.seek(startTime);
					}
					if (!controls) {
						player.getControls().hide();
					}
				} else {
					player.onLoad(function() {
						if (startTime) {
							player.seek(startTime);
						}
						if (!controls) {
							player.getControls().hide();
						}
					});
				}
			}
		}
		
		var player;
		function loaded() {
			function tmp() {
				if (window.flowplayer) {
					createPlayer();
				}
				if (player) {
					loadDeferred.resolve();
				} else {
					window.setTimeout(tmp, interval);
				}
			}
			yleEmbed.embedPlayerElement($container.get(0), {
				dataId: id, 
				dataAutoplay: !preview || !paused ? true : false
			});
			var interval = 10;
			if (!preview || !paused) {
				window.setTimeout(tmp, interval);
			} else {
				loadDeferred.resolve();
			}
		}
		
		if (!window.yle) {
			window.yle = {};
			yle.playerInitialization = {};
			yle.playerInitialization.readyCallback = loaded;
			var tag = document.createElement('script');
			tag.src = "http://player.yle.fi/assets/js/embed.js";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		} else {
			yle.playerInitialization = yle.playerInitialization || {};
			if (yle.playerInitialization.embedPreview) {
				loaded();
			} else {
				if (yle.playerInitialization.readyCallback) {
					var oldReadyCallback = yle.playerInitialization.readyCallback;
					yle.playerInitialization.readyCallback = function() {
						oldReadyCallback();
						loaded();
					}
				} else {
					yle.playerInitialization.readyCallback = loaded;
				}
			}
		}
		
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		};
		
		var startTriggered = false;
		var started = false;
		self.start = function() {
			started = true;
			Magicaster.console.log("[Areena] start");
			if (!preview && paused) {				
				player.pause();
			}
		};
		
		self.tick = function(time) {
//			Magicaster.console.log("[Areena] tick", time);
			if (!player && window.flowplayer) {
				createPlayer();
			}
			if (player) {
				var time = player.getTime();
				_.each(cue, function (cue) {
					if (time > parseFloat(cue.time) && !cue.triggered) {
						if (cue.name) {
							var args = {
								'time': time,
								'name': cue.name
							};
							layer.triggerEvent("cue", args);
							layer.triggerEvent("cue_" + cue.name, args);
						}
						cue.triggered = true;
					}
				});
			}
		};
		
		self.adjust = function(width, height, aspectRatio) {
//			Magicaster.console.log("[Areena] adjust", width, height, aspectRatio);
			$container.width(width);
			$container.height(height);
			layer.setGeometry({
			    width: width,
				height: height
            });
		};
		
		/*
		self.render = function() {
			Magicaster.console.log("[Areena] render");
		};
		*/
		
		self.action = function(method, parameters) {
			Magicaster.console.log("[Areena] action", method, parameters);
			switch (method) {
				case "play":
					manualPlay = true;
					player.play();
					break;
				case "pause":
					manualPause = true;
					player.pause();
//					if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
//						$(player.getIframe()).attr('src', $(player.getIframe()).attr('src'));
//						$('body').append($(player.getIframe()));
//						$container.append($(player.getIframe()));
//					}
					break;
				case "resume":
					manualPlay = true;
					player.resume();
					break;
				case "stop":
					player.stop();
					break;
				case "seek":
					player.seek(layer.resolveAndGetValue(parameters.timeValue));
					break;
			}
		};

		self.action_methodName = function(parameters, eventArgs) {
		};
		
		 self.destroy = function() {
			Magicaster.console.log("[Areena] destroy");
		};
		
    }

    return Areena;
});