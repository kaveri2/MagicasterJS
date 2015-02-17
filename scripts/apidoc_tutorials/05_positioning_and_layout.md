----

## Overview ##

This tutorial will help you position your magicast components correctly on the web page. Let's get started...

## Different modes of positioning (most common cases, feel free to position your elements however you like, these are just suggestions) ##

1. Positioning on flow with known size
1. Positioning on flow with dynamic size
1. Fullscreen Magicast
1. Background Magicast
1. Magicast that is designed for a certain size (will downscale the contents to fit the area that you define)

## 1. Positioning on flow with known size ##

This is the easiest method of positioning a magicast. If the magicast is creted using relative sizes or if you know the size the magicast is designed for,
you can just position the magicast like:
	
	.magicast-container {
		width: 400px;
		height: 320px;
	}

## 2. Positioning on flow with size taken from a magicast layer ##

If you want to give total control of the space that the Magicast container takes from the page to the Magicast object, you can define a layer that the Magicast uses as a viewport by setting a node property named viewport.

	<property>
	<name>viewport</name>
	<value>layer1</value>
	</property>
	
By defining viewport like this, the child element of the magicast can grow larger than the Magicast container, which means that it's up to the designer
to choose whether they want the content to overlow from the container. Overflow can be controlled by setting one of the following overlflow styles for the container.

	.magicast-container {
			overflow:visible;
			overflow:auto;
			overflow:scroll;
			overflow:hidden;
		}
		
[Further information regarding overflow values](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)

You may also refine the space available for the Magicast object using min and max width/height on the root element. By defining:

	.magicast-container {
				min-width:50%;
				max-width:900px;
			}
			
The above CSS will allow the Magicast container to take up 900px of space at max (the rest will overflow) and make sure that the Magicast container
is always at least 50% wide when compared to it's parent element.

- Controlling Magicast container's size:

The most common case for this is perhaps inserting images of arbitrary size to a web page. In this case we would most likely want to define the Magicast properties like this:

	<node>
		<name>node1</name>
		<property>
			<name>viewport</name>
			<value>layer1</value>
		</property>
		<layer>
			<name>layer1</name>
			<property>
				<name>relWidth</name>
				<value>100</value>
			</property>
			<property>
				<name>absHeight</name>
				<value>0</value>
			</property>
			<property>
				<name>maintainAspectRatio</name>
				<value>max</value>
			</property>
		</layer>
	</node>

The above XML will keep the aspect ratio of the image and make it as large as possible. The only thing that controls the size of the image is the width given to the Magicast container.

## 3. Fullscreen Magicast ##

In order to create a Magicast that fills the whole browser window, the following structure and styling can be used.

    <body>
    <div style="position:absolute;width:100%;height:100%;overflow:hidden" data-magicast-xml="magicast.xml"></div>
    </body>

## 4. Background magicast ##

A background Magicast is a Magicast that is located behind rest of the content. The most common usecase for a background Magicast is creating a dynamic background for a page by using images and/or videos. The magicast can be placed in the background by positioning it properly in the document flow or by using z-index. It is advisable to avoid using z-index if the document structure can be controlled as using z-index can lead into a less maintainable structure or cause side-effects.

A typical background Magicast container is positioned something like this:

    <body>
    <div id="backgroundmagicast" class="magicast-container" data-magicast-xml="magicast.xml"></div>
    <p>lorem ipsum</p>
    ...
    </body>

And has it's CSS defined with something like this:

    .magicast-container {
      overflow: hidden;
      position:fixed;
      width:100%;
      height:100%;
      margin:0;
      padding:0;
      top:0;
      left:0;
    }

By using fixed positioning the Magicast will always be positioned in the same place on screen regardless of scroll position, though fixed positioning doesn't work correctly with all mobile devices.

## 5. Magicast that is designed for a certain size (will scale the contents to fit the area that you define) ##

If a Magicast is designed for a certain size you can make the Magicast downscale (or upscale) it's contents to fit the given dimensions.

To enable down/upscaling of content to fit the element's dimensions you can define a min/max width & height for a Magicast.

For example:

    <minWidth>1000</minWidth>
    <maxWidth>1000</maxWidth>
    ...

The above will always scale the Magicast object, if the Magicast container's width is something other than 1000px.