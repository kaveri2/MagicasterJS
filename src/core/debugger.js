/**
 * @preserve Copyright (c) 2013 Yleisradio (YLE)
 * (http://www.yle.fi) and MagicasterJS Contributors (1)
 *
 * (1) MagicasterJS Contributors are listed in the AUTHORS file.
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

define(['jquery', "utils/utils"], function ($, Utils) {
    'use strict';

    var Debugger = (function () {

        var DEBUG = true;

        var method;
        var methods = [
            'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
            'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
            'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
            'timeStamp', 'trace', 'warn'
        ];
        var length = methods.length;
        var console = (window.console = window.console || {});

        while (length--) {
            method = methods[length];

            // Only stub undefined methods.
            if (!console[method]) {
                console[method] = $.noop;
            }
        }

        function logFunction() {
            if (Function.prototype.bind) {
                return Function.prototype.bind.call(console.log, console);
            }
            else {
                return function () {
                    Function.prototype.apply.call(console.log, console, arguments);
                };
            }
        }

        function errorFunction() {
            if (Function.prototype.bind) {
                return Function.prototype.bind.call(console.error, console);
            }
            else {
                return function () {
                    Function.prototype.apply.call(console.error, console, arguments);
                };
            }
        }

        var log = (DEBUG ? logFunction() : $.noop);
        var error = (DEBUG ? errorFunction() : $.noop);
		
		var svgns = "http://www.w3.org/2000/svg";

        var uneditable = ["dragX","dragY"];
        var slider = ["relX", "relY", "relReferenceX", "relReferenceY", "relWidth", "relHeight"];
        var toggle = ["visible", "draggable", "enablePointer", "accelerated"];

        /**
         * Calling this method will append the debugging "toolbox" to the page that can be used to check and modify layer properties
         * @param magicast
         */
        var drawMagicastDebug = function (magicast) {
            $(".debugWrap[name=" + magicast.name + "]").remove();
            var wrap = $("<div class='debugWrap' style='position:absolute;background-color:rgba(255,200,200,0.7);left:0;top:0;z-index: 999999'>" +
                "<div class='drag' style='height:35px;pointer-events:auto;background-color:rgba(200,200,255,0.7);'>" + magicast.name + "</div>" +
                "<div class='layerDebug' style='height:200px;width:250px;overflow:scroll;resize:both'></div>" +
                "</div>");
            wrap.attr({name: magicast.name});
            var el = wrap.find(".layerDebug");
            var drag = wrap.find(".drag");
            var ul = $("<ul></ul>").css({
                "list-style-type": "none",
                margin: 0,
                padding: 0
            });
            var lis = [];
            _(magicast.getLayers()).each(function (layer) {

                var li = $("<li style='display:block;'><span style='text-decoration:underline;cursor:pointer'>" + layer.name + "</span></li>").attr({name: layer.name}).css({padding: "10px"});
                li.click(function (e) {
                    e.stopPropagation();
                    if (e.target === li.children(":first")[0]) {
                        li.find(".data").toggle();
                    }
                });

                var ele = $("<div class='data' style='display:none;'></div>");
                $(layer).on("update", function () {
                    var data = generateInputs(layer);
                    ele.html(data);
                });

                var data = generateInputs(layer);
                ele.html(data);

                li.append(ele);
                lis.push(li);
            });
            console.log(lis.length);
            ul.append(lis);
            el.append(ul);

            Utils.addDragSupport(drag[0], wrap[0]);

            $("body").append(wrap);
        };

        var generateInput = function (layer, key, value, readonly) {

			var layerProperties = layer.getProperties();
            var wrap = $("<div class='property'></div>");
            var keydiv = $("<label style='display:block;text-decoration:none'></label>").text(key);
            var input = $("<input>").val(value);
            var input2;
            var label, label2;
            if (readonly || uneditable.indexOf(key) !== -1) {
                input.attr({readonly: true});
            }
            if (slider.indexOf(key) !== -1) {
                var t;
                input.attr({type: 'range', min: 0, max: 100}).val(value || 0);
                input2 = $("<input style='width:30px;vertical-align: top'>").val(input.val());
                input.on("change", function () {
                    input2.val($(this).val());
                    input2.trigger("change");
                });
                input2.on("change", function () {
                    if (t) {
                        clearTimeout(t);
                    }
                    layerProperties[key] = $(this).val();
                    t = setTimeout(function () {
                        $(layer).trigger("resize");
                    }, 1000);
                });
            }
            else if (toggle.indexOf(key) !== -1) {
                var initial = value === true;
                input.attr({type: 'radio', name: layer.name + key + "toggle", class: 'toggle'}).val("true");
                label = $("<label class='btn on'>True</label>").on("click", function () {
                    input.trigger("change").prop("checked", true);
                });

                input2 = $("<input type='radio'>").attr({name: layer.name + key + "toggle", class: 'toggle'}).val("false");
                label2 = $("<label class='btn off'>False</label>").on("click", function () {
                    input2.trigger("change").prop("checked", true);
                });

                var ignore = initial ? input.attr({checked: "checked"}) : input2.attr({checked: "checked"});

                var changed = function (e) {
                    var newVal = $(this).val() === "true";
                    layerProperties[key] = newVal;
                    $(layer).trigger("resize");
                };

                $([input[0], input2[0]]).on("change", changed);
                //$([input[0],input2[0]]).off("change",changed);
            }
            else {
                input.on("change", function () {
                    layerProperties[key] = $(this).val() !== "" ? $(this).val() : undefined;
                    $(layer).trigger("resize");
                });
            }
            wrap.append(keydiv);
            wrap.append(input);
            if (label) {
                wrap.append(label);
            }
            if (input2) {
                wrap.append(input2);
            }
            if (label2) {
                wrap.append(label2);
            }
            return wrap;

        };

        var generateInputs = function (layer) {
			var layerProperties = layer.getProperties();
			var layerCalculations = layer.getCalculations();
            var data = $("<div></div>");
            var inputs = [];
            _(layerProperties).each(function (value, key) {
                var input = generateInput(layer, key, value);
                inputs.push(input);
            });
            _(layerCalculations).each(function (value, key) {
                var input = generateInput(layer, key, value, true);
                inputs.push(input);
            });
            data.append(inputs);
            return data;
        };


        /**
         * Draws layer debug boundaries with svg
         * @param magicast
         * @param layer
         */
        var drawLayerDebug = function (magicast, layer) {
            if (layer.debug) {
                layer.debug.remove();
            }

            var props = layer.getProperties();
            var calcs = layer.getCalculations();

            var scx = parseInt(props.scaleX, 10);
            var scy = parseInt(props.scaleY, 10);
            scx = !isNaN(scx) ? scx / 100 : 1;
            scy = !isNaN(scy) ? scy / 100 : 1;
            var x1 = parseInt(calcs.x, 10) || 0;
            var y1 = parseInt(calcs.y, 10) || 0;
            var width = parseInt(calcs.width, 10);
            var height = parseInt(calcs.height, 10);
            var scaledX = (1 - scx) * width;
            var scaledY = (1 - scy) * height;

            var rx = parseInt(calcs.referenceX, 10) / calcs.width || 0;
            var ry = parseInt(calcs.referenceY, 10) / calcs.height || 0;

            x1 += scaledX * rx;
            width *= scx;


            y1 += scaledY * ry;
            height *= scy;


            var referenceX = width;
            var referenceY = height;
            if (!isNaN(rx)) {
                referenceX = referenceX * rx;
            }
            if (!isNaN(rx)) {
                referenceY = referenceY * ry;
            }
            referenceX += x1;
            referenceY += y1;
            if (isNaN(x1) || isNaN(referenceX) || isNaN(y1) || isNaN(referenceY)) {
                console.error("one of the values was not a number, cancelling drawing");
                console.log(x1);
                console.log(referenceX);
                console.log(y1);
                console.log(referenceY);
                return;
            }
            var svgWrap = document.createElement("div");
            $(svgWrap).css({
                position: "relative"
            });
            var svg = document.createElementNS(svgns, 'svg');
            svg.setAttribute('class', 'line');
            $(svg).css({
                position: "absolute",
                top: 0,
                left: 0,
                "pointer-events": "none"
            });

            //svg.appendChild(makeRect(x1, y1, width, height));

            var deg = props.rotation || 0;
            var r = [referenceX, referenceY];

            var poly = makePolygon([
                [x1, y1],
                [x1 + width, y1],
                [x1 + width, y1 + height],
                [x1, y1 + height]
            ], r, deg);
            svg.appendChild(poly);

            var start = [x1, y1];
            svg.appendChild(makeLine(start, r, r, deg));
            svg.appendChild(makeTriangle(r, deg));

            layer.debug = $(svg);
            magicast.$root.find(".magicastjs-viewport").append(layer.debug);
        };

        function applyRotation(coords, reference, d) {
            var px = coords[0];
            var py = coords[1];
            var ox = reference[0] || 0;
            var oy = reference[1] || 0;
            var theta = d * Math.PI / 180;
            var newX = Math.cos(theta) * (px - ox) - Math.sin(theta) * (py - oy) + ox;
            var newY = Math.sin(theta) * (px - ox) + Math.cos(theta) * (py - oy) + oy;
            return [newX, newY];
        }

        function makeLine(start, end, r, deg) {
            var line = document.createElementNS(svgns, 'line');
            var a = applyRotation;
            start = a(start, r, deg);
            end = a(end, r, deg);
            line.setAttribute('x1', start[0]);
            line.setAttribute('y1', start[1]);
            line.setAttribute('x2', end[0]);
            line.setAttribute('y2', end[1]);
            line.setAttribute("stroke", "#ff0000");
            line.setAttribute("stroke-width", "2");
            return line;
        }

        /* Pass an array like [[x,y],[x2,y2]] */
        function makePolygon(arrayOfPoints, r, deg) {
            var ar = arrayOfPoints;
            var strs = [];
            _(ar).each(function (coords) {
                coords = applyRotation(coords, r, deg);
                strs.push(coords.join(","));
            });
            var polyString = strs.join(" ");
            //log(polyString);
            var shape = document.createElementNS(svgns, "polygon");
            shape.setAttributeNS(null, "points", polyString);
            shape.setAttributeNS(null, "fill", "none");
            shape.setAttributeNS(null, "stroke", "red");
            shape.setAttributeNS(null, "stroke-width", "2");

            return shape;
        }

        function makeTriangle(coords, deg) {
            var x = coords[0];
            var y = coords[1];
            var r = [x, y];
            var shape = document.createElementNS(svgns, "polygon");
            var d = 15;
            var a = applyRotation;
            var points = [
                a([x, y], r, deg).join(','),
                a([x - d, y - d], r, deg).join(','),
                a([x + d, y - d], r, deg).join(',')
            ].join(' ');
            shape.setAttributeNS(null, "points", points);
            shape.setAttributeNS(null, "fill", "none");
            shape.setAttributeNS(null, "stroke", "red");
            shape.setAttributeNS(null, "stroke-width", "2");

            return shape;
        }

        return{
            drawMagicastDebug: drawMagicastDebug,
            drawLayerDebug: drawLayerDebug,
            log: log,
            error: error
        };

    })();

    return Debugger;
});
