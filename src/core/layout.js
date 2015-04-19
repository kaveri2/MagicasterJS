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

define(["jquery", "utils/utils", "jquery.easing", "verge"], function ($, Utils) {
    "use strict";

    $.ease = function (start, end, duration, easing, callback, completeFunction) {
        if (start === end) {
            return;
        }
        // Create a jQuery collection containing the one element
        // that we will be animating internally.
        var easer = $("<div>");

        // Keep track of the iterations.
        var stepIndex = 0;

        // Get the estimated number of steps - this is based on
        // the fact that jQuery appears to use a 13ms timer step.
        //
        // NOTE: Since this is based on a timer, the number of
        // steps is estimated and will vary depending on the
        // processing power of the browser.
        var estimatedSteps = Math.ceil(duration / 13);

        // Set the start index of the easer.
        easer.css("easingIndex", 0);

        // Animate the easing index to the final value. For each
        // step of the animation, we are going to pass the
        // current step value off to the callback.
        easer.animate(
            {
                easingIndex: end - start
            },
            {
                easing: easing,
                duration: duration,
                step: function (index) {
                    // Invoke the callback for each step.
                    callback(
                        index + start,
                        stepIndex++,
                        estimatedSteps,
                        start,
                        end
                    );
                },
                complete: completeFunction
            }
        );
        return easer;
    };
	
    function Layout(magicast) {
	
        if (!(this instanceof Layout)) {
            throw new TypeError("Constructor cannot be called as a function.");
        }
		
        var self = this;

		var scale = 1;
		var viewport;
		var stage;
		
        self.debugger = null;
 
		var dirty = true;
        $(window).on("resize", function() {
            dirty = true;
        });
		
		self.dirty = function() {
			dirty = true;
		}
		
        /**
         *
         * Property mappings to convert layer properties to css, to support a new property, add a new function with the property name
         */
        var propertyMappings = {
            width: function (value, layer) {
                return {width: value + "px"};
            },
            height: function (value, layer) {
                return {height: value + "px"};
            },
            x: function (value, layer) {
                return {left: value + "px"};
                //layer.transforms.translateX = value;
                //return Utils.generateTransformVariants("translateX", value + "px");
            },

            y: function (value, layer) {
                return {top: value + "px"};
                //layer.transforms.translateY = value;
                //return Utils.generateTransformVariants("translateY", value + "px");
            },
            scaleX: function (value, layer) {
                layer.transforms.scaleX = value;
                var obj = generateTransforms("scaleX", value);
                return obj;
            },
            scaleY: function (value, layer) {
                layer.transforms.scaleY = value;
                var obj = generateTransforms("scaleY", value);
                return obj;
            },
            rotation: function (value, layer) {
                layer.transforms.rotate = value;
                return generateTransforms("rotate", value + "deg");
            },
            alpha: function (value, layer) {
                return {opacity: value};
            },
            visible: function (value, layer) {
                var vis = value === true || value === "true" ? "visible" : "hidden";
                return {visibility: vis};
            },
            enablePointer: function (value, layer) {
                var val = value === true || value === "true" ? "auto" : "none";
                return {"pointer-events": val};
            },
            accelerated: function (value, layer) {
                if (value) {
                    return Utils.generateTransformVariants("translateZ", "0");
                }

            },
            mask: function (value, layer) {
                //TODO: Implement handling of mask layer, should change layerClip size to match the size of layer that is passed as value
                return {};
            } ,
            transformOrigin: function (value, layer) {
                return Utils.generateCssVariants("transform-origin", value);
            },
			cursor: function (value, layer) {
				return {"cursor": value};
			},
			selectable: function (value, layer) {
                var val = value === true || value === "true" ? "all" : "none";
				return {
					"-webkit-user-select": val,
					"-khtml-user-select": val,
					"-moz-user-select": val,
					"-o-user-select": val,
					"user-select": val
				};
			}
        };

        /**
         * Converts a layer's properties to matching css styles using the propertyMappings object defined in layout
         * @param layer
         * @param properties
         * @returns Object css object containing all the calculated styles for a layer
         */

        function convertToCss(layer) {
            var css = {};
            var properties = {};
			
			var layerGeometry = layer.getGeometry();
			var layerProperties = layer.getProperties();
			var layerCalculations = layer.getCalculations();

			var scaleX = (layerCalculations.width / layerGeometry.width);
			var scaleY = (layerCalculations.height / layerGeometry.height);
						
            var additionalProperties = {
                //"accelerated": true,     // Apply HW acceleration by default to the layer
                "transformOrigin": (layerCalculations.referenceX) + "px " + (layerCalculations.referenceY) + "px",

				// override properties and calculations for scaling
				"width": layerGeometry.width,
				"height": layerGeometry.height,
				"scaleX": layerCalculations.scaleX * scaleX,
				"scaleY": layerCalculations.scaleY * scaleY,
				"x": layerCalculations.x - (layerCalculations.referenceX),
				"y": layerCalculations.y - (layerCalculations.referenceY)
            };

            _(properties).extend(layerProperties).extend(layerCalculations).extend(additionalProperties);

            _(propertyMappings).each(function(key, value) {
                if (properties[value] !== undefined) {
                    var cssProperty = propertyMappings[value](properties[value], layer);
                    var exists = false;
                    _.each(_.keys(cssProperty), function (key) {
                        if (_.contains(_.keys(css), (key))) {
                            exists = true;
                            css[key] += " " + cssProperty[key];
                        }
                    });
                    if (!exists) {
                        css = _.extend(css, cssProperty);
                    }
                }
            });

            var cssString = "";
            _(css).each(function(value, key) {
                cssString += key + " : " + value + "; ";
            });
			
            return cssString;
        }


        /**
         * Updates a layers property, called by changeProperty action
         * @param layer reference to the layer that should be updated
         * @param params object containing the property that should be updated and the new value to use to calculate the new value
         * @param eventArgs params passed from event
         */
        self.changeProperty = function (layer, property, value, ease, time, callback) {
			
			var layerProperties = layer.getProperties();

			// boolean properties
			if (property=="visible" ||
				property=="enablePointer" ||
				property=="selectable" ||
				property=="draggable" ||
				property=="accelerated" ||
				property=="triggerVisibilityEvents" ||
				false) {
				value = value === "true";
			};
			
			// if property is not float, change immediately
			var floatValue = parseFloat(value);			
			if (isNaN(floatValue)) {
				layerProperties[property] = value;
                dirty = true;
				if (callback) {
					callback();
				}
				return;
			}
			
			// proceed to animation...

            layer.animations = layer.animations || {};

            var transition = {
                easing: ease,
                duration: time * 1000,
                queue: false
            };
			
			var startValue;

            // custom handling for a property should be implemented like this if needed
            if (property === "someCustomValueThatNeedsHandling") {
                startValue = 0;
                transition.step = function (now, tween) {
                    /*Implement me*/
                };
            }

            //if no custom handling is needed for a property we just calculate the changes, convert it to css and pass that to animate
            else {
                startValue = parseInt(layerProperties[property], 10);
                transition.step = function (now) {
                    layerProperties[property] = now;
                };
            }

            var ts = function () {
                transition.step.apply(this, arguments);
                dirty = true;
            };

            var cf = callback ? callback : $.noop;

            var ignore = layer.animations[property] && layer.animations[property].stop();

            var anim = $.ease(
                startValue || 0,
                floatValue,
                transition.duration,
                transition.easing,
                ts,
                cf
            );

            // Stored only to avoid duplicate overlapping animations.
            layer.animations[property] = anim;
        };
		
		self.stopAnimations = function (layer) {
			if (layer.animations) {
				_.each(layer.animations, function(property, anim) {
					if (anim && anim.stop) {
						anim.stop();
					}
				});
				self.animations = null;
			}
		};

        /**
         * Calculates the layer's properties, should be done every time a property changes
         * @param layer
         * @param properties
         * @returns {*}
         */
        function calculateLayer(layer) {
		
			if (layer.calculated) return;
			layer.calculated = true;

            // If there is no viewport defined, use magicast's container for calculating the geometry
            // When viewport is defined, only viewport layer uses magicast's container as source for calculations.
            var $lcp = viewport && (viewport !== layer) ? viewport.getClipper() : magicast.$root;

            layer.parentWidth = $lcp[0].clientWidth;
            layer.parentHeight = $lcp[0].clientHeight;
			
            var layerProperties = layer.getProperties();
            var layerCalcs = layer.getCalculations();
			
			var refFrameLayer = null;
			var refFrameLayerProperties = null;
			var refFrameLayerCalculations = null;
			if (layerProperties.refFrame) {
				refFrameLayer = magicast.findLayerByName(layerProperties.refFrame);
				if (refFrameLayer) {
					calculateLayer(refFrameLayer);
					refFrameLayerProperties = refFrameLayer.properties;
					refFrameLayerCalculations = refFrameLayer.calculations;
				}
			}			

            var w, h; // used in calculations
			
            if (layerProperties.absWidth !== undefined) {
                w = parseFloat(layerProperties.absWidth);
			}
            if (layerProperties.relWidth !== undefined) {
                w = (w ? w : 0) + layer.parentWidth * parseFloat(layerProperties.relWidth) / 100;
            }
			
            if (layerProperties.absHeight !== undefined) {
                h = parseFloat(layerProperties.absHeight);
			}
            if (layerProperties.relHeight !== undefined) {
                h = (h ? h : 0) + layer.parentHeight * parseFloat(layerProperties.relHeight) / 100;
            }
						
            if (layerProperties.aspectRatio !== undefined) {
				if (w === undefined && h !== undefined) {
					w = h * layerProperties.aspectRatio;
				} else if (h === undefined && w !== undefined) {
					h = w / layerProperties.aspectRatio;
				} else if (w !== undefined && h !== undefined) {
					if (layerProperties.maintainAspectRatio === "min") {
						if (w / h > layerProperties.aspectRatio) {
							w = h * layerProperties.aspectRatio;
						} else {
							h = w / layerProperties.aspectRatio;
						}
					}
					else if (layerProperties.maintainAspectRatio === "max") {
						if (w / h > layerProperties.aspectRatio) {
							h = w / layerProperties.aspectRatio;
						} else {
							w = h * layerProperties.aspectRatio;
						}
					}
				}
            }
			
			/*
			if (refFrameLayerCalculations) {				
				var rtw = refFrameLayerCalculations.width / 100;
				var rth = refFrameLayerCalculations.height / 100;
		
				if (layerProperties.refFrameRelWidth != null) {
					widthSet = true;
					width = width + rtw * layerProperties.refFrameRelWidth;
				} 
				if (layerProperties.refFrameRelHeight != null) {
					heightSet = true;
					height = height + rth * layerProperties.refFrameRelHeight;					
				}
			}
			*/
			
			// get the layer's geometry for further calculations
			if (layer.getComponent()) {
				if (layer.getComponent().adjust) {
					// the component can adjust to given width/height/aspectRatio
					// and change the geometry in doing so
					layer.getComponent().adjust(w, h, layerProperties.aspectRatio);
				}
			}
			
			var geometry = layer.getGeometry();

			if (w === undefined) {
				w = geometry.width;
			}

			if (h === undefined) {
				h = geometry.height;
			}
								
			if (layerProperties.aspectRatio !== undefined) {
				layerCalcs.aspectRatio = layerProperties.aspectRatio;
			}
			else {
				layerCalcs.aspectRatio = geometry.width / geometry.height;			
			}

			if (layerProperties.maintainAspectRatio === "min") {
				if (w / h > layerCalcs.aspectRatio) {
					w = h * layerCalcs.aspectRatio;
				} else {
					h = w / layerCalcs.aspectRatio;
				}
			}
			else if (layerProperties.maintainAspectRatio === "max") {
				if (w / h > layerCalcs.aspectRatio) {
					h = w / layerCalcs.aspectRatio;
				} else {
					w = h * layerCalcs.aspectRatio;
				}
			}
			
			layerCalcs.width = w;
			layerCalcs.height = h;
			
            var tmp;
            if (layerProperties.relReferenceX !== undefined) {
                tmp = (geometry.width ? geometry.width / 100 * parseFloat(layerProperties.relReferenceX) : 0);
            }
            if (layerProperties.absReferenceX !== undefined) {
                tmp = tmp || 0;
                tmp = tmp + parseFloat(layerProperties.absReferenceX);
            }
            if (tmp !== undefined) {
                layerCalcs.referenceX = tmp;
            } else {
                layerCalcs.referenceX = 0;
			}
            tmp = undefined;
            if (layerProperties.relX !== undefined) {
                tmp = (layer.parentWidth ? layer.parentWidth / 100 * parseFloat(layerProperties.relX) : 0);
            }
            if (layerProperties.absX !== undefined) {
                tmp = tmp || 0;
                tmp = tmp + parseFloat(layerProperties.absX);
            }
            if (layerProperties.selfRelX !== undefined) {
                tmp = tmp || 0;
                tmp = tmp + parseFloat(layerProperties.selfRelX / 100 * w);
            }
            if (layerProperties.dragX !== undefined) {
                tmp = tmp || 0;
                tmp = tmp + parseFloat(layerProperties.dragX);
            }
            if (tmp !== undefined) {
                layerCalcs.x = tmp;
            }
            tmp = undefined;
            if (layerProperties.relReferenceY !== undefined) {
                tmp = (geometry.height ? geometry.height / 100 * parseFloat(layerProperties.relReferenceY) : 0);
            }
            if (layerProperties.absReferenceY !== undefined) {
                tmp = tmp || 0;
                tmp = tmp + parseFloat(layerProperties.absReferenceY);
            }
            if (tmp !== undefined) {
                layerCalcs.referenceY = tmp;
            } else {
                layerCalcs.referenceY = 0;
			}
            tmp = undefined;
            if (layerProperties.relY !== undefined) {
                tmp = (layer.parentHeight ? layer.parentHeight / 100 * parseFloat(layerProperties.relY) : 0);
            }
            if (layerProperties.absY !== undefined) {
                tmp = tmp || 0;
                tmp += parseFloat(layerProperties.absY);
            }
            if (layerProperties.selfRelY !== undefined) {
                tmp = tmp || 0;
                tmp = tmp + parseFloat(layerProperties.selfRelY / 100 * w);
            }
            if (layerProperties.dragY !== undefined) {
                tmp = tmp || 0;
                tmp = tmp + parseFloat(layerProperties.dragY);
            }
            if (tmp !== undefined) {
                layerCalcs.y = tmp;
            }
			
            if (layerProperties.scaleX !== undefined) {
                layerCalcs.scaleX = parseFloat(layerProperties.scaleX) / 100;
            } else {
                layerCalcs.scaleX = 1;
			}
            if (layerProperties.scaleY !== undefined) {
                layerCalcs.scaleY = parseFloat(layerProperties.scaleY) / 100;
            } else {
                layerCalcs.scaleY = 1;
			}
			
			if (layerProperties.alpha !== undefined) {
				layerCalcs.alpha = parseFloat(layerProperties.alpha) / 100;
			}
			
			if (refFrameLayerCalculations) {
		
				// scale
				if (layerProperties.refFrameAnchorScaleX) layerCalculations.scaleX = layerCalculations.scaleX * refFrameLayerCalculations.scaleX;
				if (layerProperties.refFrameAnchorScaleY) layerCalculations.scaleY = layerCalculations.scaleY * refFrameLayerCalculations.scaleY;
			
				// rotation
				if (layerProperties.refFrameAnchorRotation) layerCalculations.rotation = layerCalculations.rotation + refFrameLayerCalculations.rotation;

				// alpha
				if (layerProperties.refFrameAnchorAlpha) layerCalculations.alpha = layerCalculations.alpha * refFrameLayerCalculations.alpha;

				// x, y
				
				/*
				if (layerProperties.refFrameAnchorX) layerCalculations.parallaxLevelX = layerCalculations.parallaxLevelX + refFrameLayerCalculations.parallaxLevelX;
				var tmpX:Number = refFrameLayer.originalWidth ? -refFrameLayerCalculations.referenceX / refFrameLayer.originalWidth * refFrameLayerCalculations.width : 0;
				if (layerProperties.refFrameAbsX != null) tmpX = tmpX + layerProperties.refFrameAbsX;
				if (layerProperties.refFrameRelX != null) tmpX = tmpX + layerProperties.refFrameRelX * refFrameLayerCalculations.width / 100;
				if (layerProperties.refFramSelfRelX != null) tmpX = tmpX; // TODO

				if (layerProperties.refFrameAnchorY) layerCalculations.parallaxLevelY = layerCalculations.parallaxLevelY + refFrameLayerCalculations.parallaxLevelY;
				var tmpY:Number = refFrameLayer.originalHeight ? -refFrameLayerCalculations.referenceY / refFrameLayer.originalHeight * refFrameLayerCalculations.height : 0;
				if (layerProperties.refFrameAbsY != null) tmpY = tmpY + layerProperties.refFrameAbsY;
				if (layerProperties.refFrameRelY != null) tmpY = tmpY + layerProperties.refFrameRelY * refFrameLayerCalculations.height / 100;
				if (layerProperties.refFramSelfRelY != null) tmpY = tmpY; // TODO
				
				// special case: 
				// if reference layer is not scaled according to parallax, the reference plane must be scaled
				if (refFrameLayerCalculations.parallaxLevel && !refFrameLayerCalculations.parallaxScale) {
					scale = properties.cameraParallaxLevel / (1 + (refFrameLayerCalculations.parallaxLevel - 1) / properties.cameraParallaxLevel);
				} else {
					scale = 1;
				}
				
				tmpX = tmpX * refFrameLayerCalculations.refFrameScaleX * scale;
				tmpY = tmpY * refFrameLayerCalculations.refFrameScaleY * scale;
				var tmpCos:Number = Math.cos(refFrameLayerCalculations.rotation / 360 * Math.PI * 2);
				var tmpSin:Number = Math.sin(refFrameLayerCalculations.rotation / 360 * Math.PI * 2);								
				layerCalculations.parallaxLevelX = layerCalculations.parallaxLevelX + (tmpX * tmpCos - tmpY * tmpSin);
				layerCalculations.parallaxLevelY = layerCalculations.parallaxLevelY + (tmpY * tmpCos + tmpX * tmpSin);
				
				// parallaxLevel
				if (layerProperties.refFrameAnchorParallaxLevel) layerCalculations.parallaxLevel = layerCalculations.parallaxLevel + refFrameLayerCalculations.parallaxLevel;
				*/
			}
			
			
            // Check if there are dragBounds defined
            if (layerProperties.dragBounds) {
                var minX = 0, minY = 0, maxX, maxY;
				if (!layer.dragBoundsLayer) {
					layer.dragBoundsLayer = magicast.findLayerByName(layerProperties.dragBounds);
				}
				if (layer.dragBoundsLayer) {
					var dbCalcs = layer.dragBoundsLayer.getCalculations();
					minX = dbCalcs.x - dbCalcs.referenceX * dbCalcs.scaleX;
					minY = dbCalcs.y - dbCalcs.referenceY * dbCalcs.scaleY;
					maxX = minX + dbCalcs.width * dbCalcs.scaleX - layerCalcs.width * layerCalcs.scaleY;
					maxY = minY + dbCalcs.height * dbCalcs.scaleY - layerCalcs.height * layerCalcs.scaleY;
					
					var curX = layerCalcs.x, curY = layerCalcs.y;
					var dx = 0, dy = 0;
					if (curX < minX) {
						dx = minX - curX;
					}
					else if (curX > maxX) {
						dx = maxX - curX;
					}
					if (curY < minY) {
						dy = minY - curY;
					}
					else if (curY > maxY) {
						dy = maxY - curY;
					}
					layerProperties.dragX += dx;
					layerCalcs.x += dx;
					layerProperties.dragY += dy;
					layerCalcs.y += dy;
				}
            }
			
            return layerProperties;
        }

        function getTransformVariants() {
            return["transform", "-webkit-transform", "-moz-transform", "-ms-transform", "-o-transform"];
        }

        function generateTransforms(type, value) {
            var s = "";
            if (value !== undefined) {
                s = type + "(" + value + ")";
            }
            var obj = {};
            _.each(getTransformVariants(), function (i) {
                obj[i] = s;
            });
            return obj;
        }

        function checkLayerVisibility(layer) {
            //check if magicast is in viewport
            var verge = window.verge;
            var oldvis = layer.visibility;
            if (verge.inY(layer.getContainer(), -1 * layer.getContainer().height()) && verge.inX(layer.getContainer(), -1 * layer.getContainer().width())) {
                layer.visibility = "full";
            }
            else if (verge.inViewport(layer.getContainer())) {
                layer.visibility = "partial";
            }
            else {
                layer.visibility = "no";
            }
            if (layer.visibility !== oldvis) {
                layer.triggerEvent(layer.visibility + "PageVisibility");
            }

            //check if layer is visible inside magicast
            var ol = layer.getContainer()[0].offsetLeft;
            var ot = layer.getContainer()[0].offsetTop;
            var w = layer.getContainer().width();
            var h = layer.getContainer().height();
            var pw = layer.getContainer().parent().width();
            var ph = layer.getContainer().parent().height();
            var maxX = pw - w;
            var maxY = ph - h;
            var oldMagicastVisibility = layer.magicastVisibility;
            if (ol >= 0 && ol <= maxX && ot >= 0 && ot <= maxY) {
                layer.magicastVisibility = "full";
            }
            else if (ol < (0 - w) || ol > pw || ot < (0 - h) || ot > ph) {
                layer.magicastVisibility = "no";
            }
            else {
                layer.magicastVisibility = "partial";
            }
            if (layer.magicastVisibility !== oldMagicastVisibility) {
                layer.triggerEvent(layer.magicastVisibility + "Visibility");
            }
        }

        function updateDimensions() {
            var vp = viewport && viewport.getCalculations();
            if (vp) {
                var dims = {};
                dims.width = parseFloat(vp.width) + parseFloat(vp.x) + "px";
                dims.height = parseFloat(vp.height) + parseFloat(vp.y) + "px";

                magicast.$viewport[0].style.cssText += Utils.convertToCssString(dims);
                magicast.$root[0].style.cssText += Utils.convertToCssString(dims);
            }
        }

        function updateScaling() {
            if (magicast.scalingDims) {
				var vp = magicast.$viewport[0];
			
                var minWidth = magicast.scalingDims.minw;
                var maxWidth = magicast.scalingDims.maxw;
                var minHeight = magicast.scalingDims.minh;
                var maxHeight = magicast.scalingDims.maxh;

                var w = vp.clientWidth;
                var h = vp.clientHeight;
                var min,args;
                if (w < minWidth || h < minHeight) {
                    args = _.filter([w/minWidth,h/minHeight], function(num) { return !isNaN(num); });
                    min = _.min(args);
                    scale = min;
                }
                else if(w > maxWidth || h > maxHeight){
                    args = _.filter([w/maxWidth,h/maxHeight], function(num) { return !isNaN(num); });
                    min = _.min(args);
                    scale = min;
                }
                else {
                    scale = 1;
                }

                var transformObj = Utils.generateTransformVariants("scale", scale);
                var toObj = Utils.generateCssVariants("transform-origin", "top left");

                // Set size to match calculated value
                var dimObj = {
					width: w/min + "px",
					height: h/min + "px"
				};
                transformObj = _.extend(transformObj, toObj, dimObj);
                vp.style.cssText += Utils.convertToCssString(transformObj);
            }
        }

        function resizeLayerClipper(layer, clipDimensions) {
            var $layerClip = layer.getClipper();
            $layerClip[0].style.cssText += Utils.convertToCssString(clipDimensions);
        }

        function renderLayer(layer) {
            var $el = layer.getContainer();
            var elem = $el[0];

            // Can can override the rendeding by providing rendering implementation
            if (layer.getComponent() && layer.getComponent().render) {
                layer.getComponent().render(layer.getProperties(), layer.getCalculations());
			}
            else { // Let layout manager make the rendering (= CSS definitions)
                var cssText = convertToCss(layer);
                elem.style.cssText += "; "  + cssText;
            }

            // Adjust clipper's opacity also
            var opa = elem.style.opacity;
            var $clip = layer.getClipper();
            $clip[0].style.opacity = opa;
        }

        /**
         * Layout manager update step.
         * TODO: Add more comments and description
         */
        self.update = function() {

			// Check visibility events if defined in the properties
			// Checking in every 5th step to increase performance
            _(magicast.getLayers()).each(function (layer) {
				var layerProperties = layer.getProperties();
                if (layerProperties.triggerVisibilityEvents) {
                    if (!layer.visibilityCheckCount) {
                        layer.visibilityCheckCount = 5;
                    }
                    else {
                        layer.visibilityCheckCount += 1;
                    }
                    if (layer.visibilityCheckCount >= 5) {
                        checkLayerVisibility(layer);
                        layer.visibilityCheckCount = 0;
                    }
                }
            });
		
			if (!dirty) {
				return;
			}
			dirty = false;

            // Find viewport and stage layers
            if (!viewport) {
                viewport = magicast.findLayerByName(magicast.getProperties()["viewport"]);
            }
            if (!stage) {
                stage = magicast.findLayerByName(magicast.getProperties()["stage"]);
            }
			
            var clipDimensions = {
				width: magicast.$root.width() + "px",
				height: magicast.$root.height() + "px"
			};

            // 1st check the viewport layer if defined and resize that
            // 2nd resize magicast
            // 3rd calculate scaling to the viewport (if needed)
			if (viewport) {
				resizeLayerClipper(viewport, clipDimensions);
			}
			updateDimensions();
			updateScaling();

			if (viewport) {
                clipDimensions = {
					width: (viewport.getCalculations().width / scale) + "px",
					height: (viewport.getCalculations().height / scale) + "px"
				};
			}			

            // When magicast-level divs and containers have been refressed (if needed), loop through the layers
            // and do similar actions per each layer.
            // 1st calculate new dimensions per each layer (including the layer specific clipper updates)
            // 2nd actually "draw" the layout (~ set the CSS properties in place)
            // 3rd check the visiblity for those layers that define such property

            _(magicast.getLayers()).each(function (layer) {
				layer.calculated = false;
			});
			
            // Then loop through all the layers
            _(magicast.getLayers()).each(function (layer) {
			
                // In case there was a resize, resize also all the layers
                resizeLayerClipper(layer, clipDimensions);

				calculateLayer(layer);
				
				renderLayer(layer);
				
				if (magicast.debug) {
					if (!magicast.debugger) {
						require(["core/debugger"], function (Debugger) {
							magicast.debugger = Debugger;
							magicast.debugger.drawLayerDebug(magicast, layer);
						});
					}
					else {
						magicast.debugger.drawLayerDebug(magicast, layer);
					}
				}
            });
        };
    }

    return Layout;
});