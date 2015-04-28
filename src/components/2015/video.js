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

    function Video(data, layer) {

		var self = this;
		
		var $video = $("<video style='width: 100%; height: 100%' />");
		$video.attr({
			src: data.asset ? layer.resolveAndGetValue(data.asset) : "",
			name: "video"
		});
		layer.getContent().append($video);
		var video = $video[0];
		
		var loadDeferred = $.Deferred();
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		};

		var canPlay = $.Deferred();

		var ignore = layer.resolveAndGetValue(data.controls) != "false" && video.setAttribute("controls", "controls");
		var cue = Utils.convertToArray(data, "cue");
		_.each(cue, function (cue) {
			cue.time = parseFloat(layer.resolveAndGetValue(cue.time));
			cue.name = layer.resolveAndGetValue(cue.name);
			cue.triggered = false;
		});
		var loop = layer.resolveAndGetValue(data.loop) == "true";
		var paused = layer.resolveAndGetValue(data.paused) == "true";
		var volume = data.volume !== undefined ? parseFloat(layer.resolveAndGetValue(data.volume)) : 100;

		function setGeometry() {
			layer.setGeometry({
				width: video.videoWidth,
				height: video.videoHeight
			});
		}

		$video.on("loadedmetadata", function (e) {
			setGeometry();
			loadDeferred.resolve();
		});

		//if loadedmetadata event isn't received in a sensible amount of time, resolve component anyway (never triggered in ios)
		setTimeout(function () {
			setGeometry();
			loadDeferred.resolve();
			
			video.onclick = function () {
				video.play();
			};
		}, 2000);

		$video.on("canplaythrough", function (e) {
			canPlay.resolve();
		});

		$video.on("timeupdate", function (e) {
			var time = e.target.currentTime;
			_.each(cue, function (cue) {
				if (time > cue.time && !cue.triggered) {
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
		});
		
		$video.on("seeked", function (e) {
			var time = e.target.currentTime;
			_.each(cue, function (cue) {
				if (time < cue.time) {
					cue.triggered = false;
				} else {
					cue.triggered = true;
				}
			});
			var args = {
				'time': time
			};
			layer.triggerEvent("seek", args);
		});

		$video.on("paused", function (e) {
			layer.triggerEvent("paused");
		});

		$video.on("resumed", function (e) {
			layer.triggerEvent("resume");
		});

		$video.on("ended", function () {
			_.each(cue, function (cue) {
				cue.triggered = false;
			});
			if (loop) {
				layer.triggerEvent("loop");
				video.currentTime = 0;
				video.play();
			}
			layer.triggerEvent("complete");
		});

		function play() {
			canPlay.then(function () {
				video.play();
				video.currentTime = 0;
				setGeometry();
			});
		}

		function resume() {
			video.play();
		};

		function pause() {
			video.pause();
		};

		function stop() {
			video.pause();
			video.currentTime = 0;
		};

		function seek(time) {
			video.currentTime = time;
		};

		function setVolume(vol){
			volume = vol / 100;
			video.volume = volume;
		};

		self.start = function () {
			if (!paused) {
				play();
			}
		};
		
		self.control = function(method, parameters, eventArgs) {
			switch (method) {
				case "play":
					play();
					break;
				case "pause":
					pause();
					break;
				case "resume":
					resume();
					break;
				case "stop":
					stop();
					break;
				case "seek":
					seek(parseFloat(layer.resolveAndGetValue(parameters.time, eventArgs)));
					break;
				case "setVolume":
					setVolume(parseFloat(layer.resolveAndGetValue(parameters.value, eventArgs)));
					break;
			}
		};

		self.destroy = function () {
			pause();
			$video.off("canplay");
			$video.off("timeupdate");
			$video.off("seeked");
			$video.off("paused");
			$video.off("resumed");
			$video.off("ended");
			$video.off("loadedmetadata");
		};

	}

    return Video;
});