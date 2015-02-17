/**
 * Created with IntelliJ IDEA.
 * User: Jarno
 * Date: 9.10.2013
 * Time: 15:55
 * To change this template use File | Settings | File Templates.
 */

define(function (require) {
    "use strict";

    function AudioCtx() {
        if (!(this instanceof AudioCtx)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            console.error("audio context not available");
            return;
        }
        var self = this;
        self.available = true;

        var context = new Ctx();

        var isUnlocked = false;

        function CAudio(url) {

            var self = this;
            var startTime;
            var pauseTime;
            var paused;
            var time = 0;
            var loop = false;
            var tid;
            var volume = 1;
            var gainNode;

            function loadSound(url) {
                console.log("load sound");
                var d = $.Deferred();
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.responseType = 'arraybuffer';

                // Decode asynchronously
                request.onload = function () {
                    context.decodeAudioData(request.response, function (buf) {
                        d.resolve(buf);
                    }, function (err) {
                        console.error("error decoding data");
                        console.log(err);
                        if(!err){
                            err = {};
                            err.message = "Unable to decode audio data";
                        }
                        d.reject(err);
                    });
                };
                request.send();
                return d.promise();
            }

            function createSound(buffer) {
                console.log("create sound");

                var source = context.createBufferSource(); // creates a sound source
                source.buffer = buffer;                    // tell the source which sound to play
                gainNode = setGain(source, volume);
                //with gain applied
                gainNode.connect(context.destination);
                //without gain
                //source.connect(context.destination);

                self.source = source;

                console.log(source);

                source.onended = function () {
                    if(!paused && !source.stopped){
                        $(self).trigger("ended");
                        self.stop(source);
                    }
                };

                return source;
            }

            function timeUpdate(){
                //console.log(time);
                var t = time*1000 + (Date.now() - startTime);
                $(self).trigger("timeupdate",[t/1000]);
                tid = setTimeout(timeUpdate,1000/4);
            }

            function play(s, time) {
                s.start(0, time);
            }

            function playFrom(t) {
                if (self.source && !self.source.stopped) {
                    self.stop();
                }
                time = t || 0;
                self.ready.then(createSound).then(function (sound) {
                    paused = false;
                    pauseTime = 0;
                    startTime = Date.now();
                    play(sound, time);
                    tid = setTimeout(timeUpdate,1000/4);
                });
            }

            self.loop = function (l) {
                if (l !== undefined) {
                    loop = (l === true || false);
                }
                return loop;
            };

            self.play = function () {
                playFrom(0);
            };

            self.resume = function () {
                console.log(self.source);
                if (pauseTime) {
                    time += ( (pauseTime - startTime) / 1000);
                    console.log(time);
                }
                else {
                    time = 0;
                }
                playFrom(time);
            };

            self.pause = function () {
                if(self.source.playbackState !== self.source.PLAYING_STATE){
                    return;
                }
                console.log(self.source);
                pauseTime = Date.now();
                paused = true;
                self.source.stop(0);
                clearTimeout(tid);
            };

            self.stop = function (s) {
                var source = s || self.source;
                source.stopped = true;
                source.stop(0);
                time = 0;
                pauseTime = 0;
                clearTimeout(tid);
            };

            self.seek = function (time) {
                var t = parseFloat(time);
                playFrom(t);
            };

            self.setVolume = function(vol){
                volume = vol/100;
                if(gainNode){
                    gainNode.gain.value = volume;
                }
            };

            self.ready = loadSound(url);
        }

        function setGain(source, gain) {
            var gainNode = context.createGain();       // Create a gain node.
            source.connect(gainNode);                  // Connect the source to the gain node.
            gainNode.connect(context.destination);     // Connect the gain node to the destination.
            gainNode.gain.value = gain;                 // Controls sound volume
            return gainNode;
        }

        self.unlock = function () {
            if (isUnlocked) {
                return;
            }
            // create empty buffer and play it
            var buffer = context.createBuffer(1, 1, 22050);
            var source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);

            // by checking the play state after some time, we know if we're really unlocked
            setTimeout(function () {
                if ((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
                    isUnlocked = true;
                }
            }, 0);

        };

        self.createSound = function (url) {
            return new CAudio(url);
        };

        self.connectAudioElement = function (el) {
            var source = context.createMediaElementSource(el);
            source.connect(context.destination);
            el.play();
        };

    }

    var ac = (function () {
        var audio = null;

        function getAudioContext() {
            audio = audio || new AudioCtx();
            console.log("audio context requested");
            return audio;
        }

        return{
            getAudioContext: getAudioContext
        };
    }());

    return ac;
});