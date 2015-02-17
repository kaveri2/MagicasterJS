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

	Magicaster.console.log("[YouTube] loaded");
	
	function YouTube(data, layer) {
        /** @lends Example **/
        if (!(this instanceof YouTube)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }
		
		Magicaster.console.log("[YouTube] created", data, layer);

		var self = this;
		
		var $content = layer.getContent();
		
		var $container = $('<div><div></div></div>');
		$content.append($container);
		
		var videoId = data.videoId;
		var startTime = data.startTime !== undefined ? parseFloat(data.startTime) : undefined;
		var endTime = data.endTime !== undefined ? parseFloat(data.endTime) : undefined;
		var controls = data.controls === "true";
		var cue = Utils.convertToArray(data, "cue");
		var loop = data.loop === "true";
		var preview = data.preview !== "false";
		var paused = data.paused === "true";
		var volume = data.volume !== undefined ? parseFloat(data.volume) : 100;
		var disablekb = data.disablekb !== "false";
		
		var manualPlay = false;
		var manualPause = false;
		
		layer.setGeometry({
			width: 640,
			height: 360
		});
	
		var loadDeferred = $.Deferred();
		
		var player;
		function createPlayer() {
			player = new YT.Player($container.find('div').get(0), {
				width: 640,
				height: 360,
				videoId: videoId,
				playerVars: {
					html5: 1,
					modestbranding: 1,
					disablekb: disablekb,
					autoplay: !preview || !paused ? 1 : 0,
					controls: controls ? 1 : 0,
					loop: loop ? 1 : 0,
					rel: 0,
					showinfo: 0,
					fs: 0,
					iv_load_policy: 3
				},
				events: {
					'onReady': function(event) {
						loadDeferred.resolve();							
					},
					'onStateChange': function(event) {
						if (!startTriggered) {
							startTriggered = true;
							layer.triggerEvent("start");
						}
						var state = event.data;
						switch (state) {
							case YT.PlayerState.ENDED:
								layer.triggerEvent("complete");
							break;
							case YT.PlayerState.PLAYING:
								layer.triggerEvent("play");
							break;
							case YT.PlayerState.PAUSED:
								layer.triggerEvent("pause");
							break;
							case YT.PlayerState.BUFFERING:
							break;
							case YT.PlayerState.CUED:								
							break;
						}
					}
				}
			});
		}
		if (!window.YT) {
			var tag = document.createElement('script');
			tag.src = "//www.youtube.com/player_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			var existingOnYouTubePlayerAPIReady = window.onYouTubePlayerAPIReady;
			window.onYouTubePlayerAPIReady = function() {
				if (existingOnYouTubePlayerAPIReady) {
					existingOnYouTubePlayerAPIReady();
				}
				createPlayer();
			}
		}
		else {
			createPlayer();			
		}
		
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		};
		
        /**
         * Returns an array defining (example) component's requirements.
         * @name Example#getRequirements
         * @public
         * @method
         * @returns {Array}
         */
		 self.getRequirements = function() {
			return [];
		};
		
		var startTriggered = false;
		var started = false;
		self.start = function() {
			started = true;
			Magicaster.console.log("[YouTube] start");
			if (paused) {
				player.pauseVideo();
			}
		};
		
		self.tick = function(time) {
//			Magicaster.console.log("[YouTube] tick", time);
			time = player.getCurrentTime();
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
		};
		
		self.adjust = function(width, height, aspectRatio) {
			Magicaster.console.log("[YouTube] adjust", width, height, aspectRatio);
			player.setSize(width, height);
			layer.setGeometry({
			    width: width,
				height: height
            });
		};
		
		/*
		self.render = function() {
			Magicaster.console.log("[YouTube] render");
		};
		*/
		
		self.action = function(method, parameters) {
			Magicaster.console.log("[YouTube] action", method, parameters);
			switch (method) {
				case "play":
					manualPlay = true;
					player.playVideo();
					break;
				case "pause":
					manualPause = true;
					player.pauseVideo();
//					if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
//						$(player.getIframe()).attr('src', $(player.getIframe()).attr('src'));
//						$('body').append($(player.getIframe()));
//						$container.append($(player.getIframe()));
//					}
					break;
				case "resume":
					manualPlay = true;
					player.playVideo();
					break;
				case "stop":
					player.stopVideo();
					break;
				case "seek":
					player.seekTo(layer.resolveAndGetValue(parameters.timeValue));
					break;
				case "setVolume":
					break;
			}
		};

		self.action_methodName = function(parameters, eventArgs) {
		};
		
		 self.destroy = function() {
			Magicaster.console.log("[YouTube] destroy");
			player.destroy();
		};
		
    }

    return YouTube;
});