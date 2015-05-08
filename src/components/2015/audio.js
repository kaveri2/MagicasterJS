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

define(["jquery", "utils/utils", "utils/audioctx"], function ($, Utils, AC) {
    "use strict";

    function Audio(data, layer) {

		var self = this;
		var api;

		var canPlay = $.Deferred();
		
		var $audio = $("<audio />").attr({
			src: data.asset ? layer.resolveAndGetValue(data.asset) : "",
			name: "audio"
		});
		var audio = $audio[0];
		layer.getContent().append($audio);
		
		var cue = Utils.convertToArray(data, "cue");
		var cues = [];
		_.each(Utils.convertToArray(data, "cue"), function (cue) {
			cues.push({
				time: parseFloat(layer.resolveAndGetValue(cue.time)),
				name: layer.resolveAndGetValue(cue.name),
				triggered: false
			});
		});
		var loop = layer.resolveAndGetValue(data.loop) == "true" || false;
		var paused = layer.resolveAndGetValue(data.paused) == "true" || false;
		var volume = data.volume !== undefined ? parseFloat(data.volume) : 100;
		
		var loadDeferred = $.Deferred();
		self.getLoadPromise = function() {
			return loadDeferred.promise();
		};
		
		function play() {
			if (api) {
				api.play();
			} else {
				canPlay.then(function () {
					audio.play();
					audio.currentTime = 0;
				});
			}
		}

		function resume() {
			if (api) {
				api.resume();
			} else {
				audio.play();
			}
		}

		function pause() {
			if (api) {
				api.pause();
			} else {
				audio.pause();
			}
		}

		function stop() {
			if (api) {
				api.stop();
			} else {
				audio.pause();
				audio.currentTime = 0;
			}
		}

		function seek(time) {
			if (api) {
				api.seek(time);
			} else {
				audio.currentTime = time;
			}
		}

		function setVolume(vol) {
			if (api) {
				api.setVolume(vol);
			} else {
				volume = vol / 100;
				audio.volume = volume;
			}
		}

		self.start = function() {
			if (!paused) {
				if (api) {
					api.play();
				} else {
					play();
				}
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

		function checkCues(time) {
			_.each(cues, function (cue) {
				if (time > cue.time && !cue.triggered) {
					layer.triggerEvent(cue.eventName);
					cue.triggered = true;
				}
			});
		}

		/*
		
		AC not working ATM!
		
		//if web audio available, bind the relevant events for that
		var ac = AC.getAudioContext();
		if (ac.available) {
			//play audio using web audio api instead
			api = ac.createSound(data.asset ? layer.resolveAndGetValue(data.asset) : "");
			api.loop(loop);
			$(api).on("ended", function () {
				if (api.loop()) {
					layer.triggerEvent("loop");
					api.play();
				}
				else {
					layer.triggerEvent("complete");
				}
			});
			$(api).on("timeupdate", function (e, currentTime) {
				checkCues(currentTime);
			});

			$.when(api.ready).then(function () {
				loadDeferred.resolve();
			}, function (err) {
				loadDeferred.resolve();
			});
		}
		else {
		*/
		if (true) {
			$audio.on("loadedmetadata", function (e) {
			});
			$audio.on("error", function (e) {
				var err = e.target.error.code;
				var mes = "An error occured";
				// var MediaError = window.MediaError;
				// MediaError [MEDIA_ERR_ABORTED,MEDIA_ERR_NETWORK,MEDIA_ERR_DECODE,MEDIA_ERR_SRC_NOT_SUPPORTED,MEDIA_ERR_ENCRYPTED]
				switch (err) {
				case 1:
					mes = ("The fetching process for the media resource was aborted by the user.");
					break;
				case 2:
					mes = ("A network error has caused the user agent to stop fetching the media resource, after the resource was established to be usable.");
					break;
				case 3:
					mes = ("An error has occurred in the decoding of the media resource, after the resource was established to be usable.");
					break;
				case 4:
					mes = ("The media resource specified by src was not usable.");
					break;
				case 5:
					mes = ("The encrypted media stream could not be played.");
					break;
				}
			});
			$audio.on("timeupdate", function (e) {
				var time = e.target.currentTime;
				checkCues(time);
			});
			$audio.on("canplay", function (e) {
				canPlay.resolve();
			});
			$audio.on("ended", function () {
				if (loop) {
					layer.triggerEvent("loop");
					audio.currentTime = 0.1;
					audio.play();
				}
				else {
					layer.triggerEvent("complete");
				}
			});
			loadDeferred.resolve();
		}

		setVolume(volume);
    }

    return Audio;
});