----

## Overview ##

This document contains a list of layer properties and calculations and explains what they are used for...

### List of properties ###

    rotation - rotation in degrees
    scaleX - scale in x direction in % relative to original size
    scaleY - scale in y direction in % relative to original size
    alpha - opacity in %
    dragX - amount the layer is dragged in x direction in px
    dragY - amount the layer is dragged in y direction in px
    dragBounds - layer name to which the layer is bound or 'magicast' if bound to magicast dimensions
    absX - absolute x position in px
    absY - absolute y position in px
    relX - relative x position in px
    relY - relative y position in px
    absReferenceX - absolute reference x point in px
    absReferenceY - absolute reference y point in px
    relReferenceX - relative reference x point in %
    relReferenceY - relative reference y point in %
    aspectRatio - aspect ratio determined by user, Number
    maintainAspectRatio - min/max, maintain aspect ratio of the original component, for example an image, min will scale the component to fit fully inside the layer while showing the whole component, max will fill the layer
    by cropping off one side of the component
    visible - [true]/false, controls visibility of the element
    draggable - true/[false], determines whether the layer is draggable or not
    enablePointer - [true]/false, determines whether the layer should accept pointer events(mouse/touch)
    accelerated - true/[false], allows layer transitions to be hardware accelerated if browser supports 3d transitions

For the boolean values the default value is indicated with [].

### List of calculations ###

    width - layer width
    height - layer height
    x - layer x position
    y - layer y position
    referenceX - layer reference x point
    referenceY - layer reference y point
    aspectRatio - calculated aspect ratio for layer