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

define(["jquery", "utils/utils", "verge"], function ($, Utils) {
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
		self.dirty = function() {
			dirty = true;
		}
		
		function determineLayerDirty(layer) {
			if (layer.dirty) {
				return;
			}
            var layerProperties = layer.getProperties();
			if (layerProperties.refFrame) {
				var refFrameLayer = magicast.findLayerByName(layerProperties.refFrame);
				if (refFrameLayer) {
					determineLayerDirty(refFrameLayer);
					if (refFrameLayer.dirty) {
						layer.dirty = true;
					}
				}
			}
		}
		
        /**
         * Calculates the layer's properties, should be done every time a property changes
         * @param layer
         * @param properties
         * @returns {*}
         */
        function calculateLayer(layer) {
		
            var layerProperties = layer.getProperties();
            var layerCalculations = layer.getCalculations();
			var layerComponent = layer.getComponent();
			
			var refFrameLayer = null;
			var refFrameLayerCalculations = null;
			var refFrameLayerGeometry = null;
			if (layerProperties.refFrame) {
				refFrameLayer = magicast.findLayerByName(layerProperties.refFrame);
				if (refFrameLayer) {
					refFrameLayerCalculations = refFrameLayer.getCalculations();
					refFrameLayerGeometry = refFrameLayer.getGeometry();
				}
			}		
		
            // If there is no viewport defined, use magicast's container for calculating the geometry
            // When viewport is defined, only viewport layer uses magicast's container as source for calculations.
            var $lcp = viewport && (viewport !== layer) ? viewport.getClipper() : magicast.$root;
            var rw = $lcp[0].clientWidth;
            var rh = $lcp[0].clientHeight;
            var w, h; // used in calculations
			
            if (layerProperties.absWidth !== undefined) {
                w = layerProperties.absWidth;
			}
            if (layerProperties.relWidth !== undefined) {
                w = (w ? w : 0) + rw * layerProperties.relWidth / 100;
            }
			
            if (layerProperties.absHeight !== undefined) {
                h = layerProperties.absHeight;
			}
            if (layerProperties.relHeight !== undefined) {
                h = (h ? h : 0) + rh * layerProperties.relHeight / 100;
            }
			
			if (refFrameLayer) {
				if (layerProperties.refFrameRelWidth != null) {
					w = (w ? w : 0) + layerProperties.refFrameRelWidth * refFrameLayerCalculations.width / 100;
				} 
				if (layerProperties.refFrameRelHeight != null) {
					h = (h ? h : 0) + layerProperties.refFrameRelHeight * refFrameLayerCalculations.height / 100;
				}
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
			
			// get the layer's geometry for further calculations
			if (layerComponent) {
				if (layerComponent.adjust) {
					// the component can adjust to given width/height/aspectRatio
					// and change the geometry in doing so
					layerComponent.adjust(w, h, layerProperties.aspectRatio);
				}
			}
			
			var layerGeometry = layer.getGeometry();

			if (w === undefined) {
				w = layerGeometry.width;
			} else {
				if (!layerGeometry.width) {
					layerGeometry.width = w; 
				}
			}
			
			if (h === undefined) {
				h = layerGeometry.height;
			} else {
				if (!layerGeometry.height) {
					layerGeometry.height = h; 
				}
			}
			
			if (layerProperties.aspectRatio !== undefined) {
				layerCalculations.aspectRatio = layerProperties.aspectRatio;
			} else {
				if (layerGeometry.height) {
					layerCalculations.aspectRatio = layerGeometry.width / layerGeometry.height;
				} else {
					layerCalculations.aspectRatio = 0;
				}
			}

			if (layerProperties.maintainAspectRatio === "min") {
				if (w / h > layerCalculations.aspectRatio) {
					w = h * layerCalculations.aspectRatio;
				} else {
					h = w / layerCalculations.aspectRatio;
				}
			}
			else if (layerProperties.maintainAspectRatio === "max") {
				if (w / h > layerCalculations.aspectRatio) {
					h = w / layerCalculations.aspectRatio;
				} else {
					w = h * layerCalculations.aspectRatio;
				}
			}
			
			layerCalculations.width = w;
			layerCalculations.height = h;
			
			layerCalculations.referenceX = 0;
            if (layerProperties.relReferenceX !== undefined) {
				layerCalculations.referenceX = layerCalculations.referenceX + layerGeometry.width / 100 * layerProperties.relReferenceX;
            }
            if (layerProperties.absReferenceX !== undefined) {
                layerCalculations.referenceX = layerCalculations.referenceX + layerProperties.absReferenceX;
            }
			layerCalculations.x = 0;
            if (layerProperties.relX !== undefined) {
                layerCalculations.x = layerCalculations.x + (rw ? rw / 100 * layerProperties.relX : 0);
            }
            if (layerProperties.absX !== undefined) {
                layerCalculations.x = layerCalculations.x + layerProperties.absX;
            }
            if (layerProperties.selfRelX !== undefined) {
                layerCalculations.x = layerCalculations.x + layerProperties.selfRelX / 100 * w;
            }
			layerCalculations.x = layerCalculations.x + layerProperties.moveX;
			
			layerCalculations.referenceY = 0;
            if (layerProperties.relReferenceY !== undefined) {
				layerCalculations.referenceY = layerCalculations.referenceY + layerGeometry.height / 100 * layerProperties.relReferenceY;
            }
            if (layerProperties.absReferenceY !== undefined) {
                layerCalculations.referenceY = layerCalculations.referenceY + layerProperties.absReferenceY;
            }
			layerCalculations.y = 0;
            if (layerProperties.relY !== undefined) {
                layerCalculations.y = layerCalculations.y + (rh ? rh / 100 * layerProperties.relY : 0);
            }
            if (layerProperties.absY !== undefined) {
                layerCalculations.y = layerCalculations.y + layerProperties.absY;
            }
            if (layerProperties.selfRelY !== undefined) {
                layerCalculations.y = layerCalculations.y + layerProperties.selfRelY / 100 * h;
            }
			layerCalculations.y = layerCalculations.y + layerProperties.moveY;
			
            if (layerProperties.scaleX !== undefined) {
                layerCalculations.scaleX = layerProperties.scaleX / 100;
            } else {
                layerCalculations.scaleX = 1;
			}
            if (layerProperties.scaleY !== undefined) {
                layerCalculations.scaleY = layerProperties.scaleY / 100;
            } else {
                layerCalculations.scaleY = 1;
			}
			
			layerCalculations.alpha = layerProperties.alpha / 100;
			layerCalculations.rotation = layerProperties.rotation;
			
			if (refFrameLayer) {

				// scale
				if (layerProperties.refFrameAnchorScaleX) layerCalculations.scaleX = layerCalculations.scaleX * refFrameLayerCalculations.scaleX;
				if (layerProperties.refFrameAnchorScaleY) layerCalculations.scaleY = layerCalculations.scaleY * refFrameLayerCalculations.scaleY;
			
				// rotation
				if (layerProperties.refFrameAnchorRotation) layerCalculations.rotation = layerCalculations.rotation + refFrameLayerCalculations.rotation;

				// alpha
				if (layerProperties.refFrameAnchorAlpha) layerCalculations.alpha = layerCalculations.alpha * refFrameLayerCalculations.alpha;

				// x, y
				if (layerProperties.refFrameAnchorX) layerCalculations.x = layerCalculations.x + refFrameLayerCalculations.x;
				if (layerProperties.refFrameAnchorY) layerCalculations.y = layerCalculations.y + refFrameLayerCalculations.y;
				
				var tmpX = -refFrameLayerCalculations.referenceX / refFrameLayerGeometry.width * refFrameLayerCalculations.width;
				if (layerProperties.refFrameAbsX != null) tmpX = tmpX + layerProperties.refFrameAbsX;
				if (layerProperties.refFrameRelX != null) tmpX = tmpX + layerProperties.refFrameRelX * refFrameLayerCalculations.width / 100;
				if (layerProperties.refFrameSelfRelX != null) tmpX = tmpX + layerProperties.refFrameSelfRelX * w / 100;
				
				var tmpY = -refFrameLayerCalculations.referenceY / refFrameLayerGeometry.height * refFrameLayerCalculations.height;
				if (layerProperties.refFrameAbsY != null) tmpY = tmpY + layerProperties.refFrameAbsY;
				if (layerProperties.refFrameRelY != null) tmpY = tmpY + layerProperties.refFrameRelY * refFrameLayerCalculations.height / 100;
				if (layerProperties.refFrameSelfRelY != null) tmpY = tmpY + layerProperties.refFrameSelfRelY * h / 100;

				tmpX = tmpX * refFrameLayerCalculations.scaleX;
				tmpY = tmpY * refFrameLayerCalculations.scaleY;
				
				if (refFrameLayerCalculations.rotation) {
					var tmpCos = Math.cos(refFrameLayerCalculations.rotation / 360 * Math.PI * 2);
					var tmpSin = Math.sin(refFrameLayerCalculations.rotation / 360 * Math.PI * 2);								
					layerCalculations.x = layerCalculations.x + (tmpX * tmpCos - tmpY * tmpSin);
					layerCalculations.y = layerCalculations.y + (tmpY * tmpCos + tmpX * tmpSin);
				} else {
					layerCalculations.x = layerCalculations.x + tmpX;
					layerCalculations.y = layerCalculations.y + tmpY;
				}
				
			}
			
            // Check if there are moveDragBounds defined
            if (layerProperties.moveDragBounds) {
                var minX = 0, minY = 0, maxX, maxY;
				if (!layer.moveDragBoundsLayer) {
					layer.moveDragBoundsLayer = magicast.findLayerByName(layerProperties.moveDragBounds);
				}
				if (layer.moveDragBoundsLayer) {
					var dbCalcs = layer.moveDragBoundsLayer.getCalculations();
					minX = dbCalcs.x - dbCalcs.referenceX * dbCalcs.scaleX;
					minY = dbCalcs.y - dbCalcs.referenceY * dbCalcs.scaleY;
					maxX = minX + dbCalcs.width * dbCalcs.scaleX - layerCalculations.width * layerCalculations.scaleY;
					maxY = minY + dbCalcs.height * dbCalcs.scaleY - layerCalculations.height * layerCalculations.scaleY;
					
					var curX = layerCalculations.x, curY = layerCalculations.y;
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
					layerProperties.moveX += dx;
					layerCalculations.x += dx;
					layerProperties.moveY += dy;
					layerCalculations.y += dy;
				}
            }
		}
		
		function calculateAndRenderLayer(layer) {
			if (!layer.dirty) {
				return;
			}
			layer.dirty = false;
			
            var layerProperties = layer.getProperties();
			if (layerProperties.refFrame) {
				var refFrameLayer = magicast.findLayerByName(layerProperties.refFrame);
				if (refFrameLayer) {
					calculateAndRenderLayer(refFrameLayer);
				}
			}
			
			calculateLayer(layer);
			renderLayer(layer);
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

        function resizeLayerClipper(layer, clipperDimensions) {
            layer.getClipper().width(clipperDimensions.width).height(clipperDimensions.height);
        }

        function renderLayer(layer) {
			
			var layerProperties = layer.getProperties();
			var layerCalculations = layer.getCalculations();
			var layerComponent = layer.getComponent();
			var layerGeometry = layer.getGeometry();			

            var elem = layer.getContainer()[0];
			
            // Can can override the rendeding by providing rendering implementation
            if (layerComponent && layerComponent.render) {
                layerComponent.render(layerProperties, layerCalculations);
			}
            else { // Let layout manager make the rendering (= CSS definitions)			
				var css = {};
				css["position"] = "absolute";
				_.extend(css, Utils.generateCssVariants("box-sizing", "border-box"));
				css["white-space"] = "nowrap";
				css["width"] = layerGeometry.width + "px";
				css["height"] = layerGeometry.height + "px";
				css["opacity"] = layerCalculations.alpha;
				css["visibility"] = layerProperties.visible ? "visible" : "hidden";
				css["pointer-events"] = layerProperties.enablePointer ? "auto" : "none";
				css["cursor"] = layerProperties.cursor ? layerProperties.cursor : "auto";
				_.extend(css, Utils.generateCssVariants("transform-origin", "0px 0px 0px"));
				_.extend(css, Utils.generateCssVariants("transform", "translateX(" + layerCalculations.x + "px) translateY(" + layerCalculations.y + "px) " + (layerProperties["accelerated"] ? "translateZ(0) " : "") + " rotate(" + layerCalculations.rotation + "deg) scaleX(" + (layerCalculations.width / layerGeometry.width * layerCalculations.scaleX) + ") scaleY(" + (layerCalculations.height / layerGeometry.height * layerCalculations.scaleY) + ") translateX(" + -layerCalculations.referenceX + "px) translateY(" + -layerCalculations.referenceY + "px)"));
				_.extend(css, Utils.generateCssVariants("user-select", layerProperties.selectable ? "all" : "none"));
				elem.style.cssText = Utils.convertToCssString(css);
            }

            // Adjust clipper's opacity also
            layer.getClipper().get(0).style["opacity"] = elem.style["opacity"];
			
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
        }

		var clipperDimensions;
		
        /**
         * Layout manager update step.
         * TODO: Add more comments and description
         */
        self.update = function() {
		
			var magicastProperties = magicast.getProperties();
		
            _(magicast.getLayers()).each(function (layer) {
				var layerProperties = layer.getProperties();
				// Check visibility events if defined in the properties
				// Checking in every 5th step to increase performance
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
		
            // Find viewport and stage layers
            if (!viewport && magicastProperties["viewport"]) {
                viewport = magicast.findLayerByName(magicastProperties["viewport"]);
            }
            if (!stage && magicastProperties["stage"]) {
                stage = magicast.findLayerByName(magicastProperties["stage"]);
            }
			
			if (viewport && viewport.dirty) {
				dirty = true;
			}
			
			if (dirty) {
				// 1st check the viewport layer if defined and resize that
				// 2nd resize magicast
				// 3rd calculate scaling to the viewport (if needed)
				if (viewport) {
					magicast.$viewport.width(0).height(0);
					calculateLayer(viewport);
					viewport.dirty = true;
					var calcs = viewport.getCalculations();
					magicast.$viewport.width(calcs.width).height(calcs.height);
				}
				if (magicast.scalingDims) {
					var vp = magicast.$viewport[0];
				
					var minWidth = magicast.scalingDims.minWidth;
					var maxWidth = magicast.scalingDims.maxWidth;
					var minHeight = magicast.scalingDims.minHeight;
					var maxHeight = magicast.scalingDims.maxHeight;

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
					
					// Set size to match calculated value
					var css = {
						width: w/min + "px",
						height: h/min + "px"
					};
					_.extend(css, Utils.generateCssVariants("transform-origin", "0px 0px"), Utils.generateCssVariants("transform", "scale(scale)"));
					vp.style.cssText = Utils.convertToCssString(css);
				}				
				if (viewport) {
					clipperDimensions = {
						width: (viewport.getCalculations().width / scale),
						height: (viewport.getCalculations().height / scale)
					};
				} else {
					clipperDimensions = {
						width: magicast.$root[0].clientWidth,
						height: magicast.$root[0].clientHeight
					};
				}
			}

			// resolve if layer should be considered dirty (or clipper resized)
            _(magicast.getLayers()).each(function (layer) {
				if (dirty) {
					layer.dirty = true;
					resizeLayerClipper(layer, clipperDimensions);
				} else {			
					determineLayerDirty(layer);
				}
			});
			
			// calculate and render layers that are dirty
            _(magicast.getLayers()).each(function (layer) {
				if (layer.dirty) {
					calculateAndRenderLayer(layer);
				}
            });
			
			dirty = false;			
        };
    }

    return Layout;
});