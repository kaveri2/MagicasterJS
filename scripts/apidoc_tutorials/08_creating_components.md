
----------
## Overview ##

This tutorial describes the sequence and background, how to make a new Magicast component. Magicast components are the building blocks for designers to build Magicast presentations. The components can be very different from the complexity level. There are simple components (e.g. Box component) and then there can be very complex, even compound components (e.g. games), which include external JavaScript files and things like that.

## Basic principles 

Components in MagicasterJS are plain objects, that either implement or don't implement methods. The methods will be called in specific places of the Magicast execution, if they are implemented. If they are not implemented, a default implementation is used, or the specific logic is skipped.

## Initialization ##

Basic component initialization procedure is synchronous. This procedure can be seen from e.g. Box and Text components. The constructor gets two parameters: `data` and `layer`:

- `data` maps to parameters-block in the Magicast XML, so for example image-layer's asset within parameters maps to `data.asset` in JavaScript code.
- `layer` is the reference to the MCLayer instance responsible for creating the correct component.

## Asynchronous initialization ##

Sometimes it's not possible to initialize the component synchronously. Asynchronous initialization pattern supports those situation. The standard way to handle asynchronous actions in MagicasterJS is to use jQuery Deferred objects (see [http://api.jquery.com/jQuery.Deferred/](http://api.jquery.com/jQuery.Deferred/) ) 

The way asynchronous initialization works with the components is quite straightforward: If a method `MyComponent.getLoadPromise` is defined, it can return jQuery promise from deferred to indicate the asynchronous operation. When component has completed it's initialization procedure, it then resolves (or rejects in case of error) the deferred object, which is then notified via the returned promise to the host `MCLayer` instance.

## Showing, starting and destroying the component ##

When component content has been appended to the layer container by MCLayer instance (and current node is ready), the component is started. By default this method implementation is not required. However if custom start, stop and destroy methods are required by the component, it can define the implementations according to its custom requirements.
	
## Layer/component events and triggers -  public API ##

MagicasterJS forwards layer-specific actions to component's `MyComponent.action` method. Component on the other hand can trigger events using `MCLayer.triggerEvent` method.

## Custom Javascript and CSS loading ##

Complex components can load external Javascript files. `Magicast.loadJS(asset, callback)` provides the way to do this. Component can provide callback function implementation to do follow-up actions after loading the javascript file.

Almost the same applies to CSS files, although due to technical constraints the callback mechanism for the CSS file loading is not supported. Therefore it's recommended to utilize MagicasterJS theming and styling support for component-specific style customizations.

## Theme and style support ##

MagicasterJS theme support guidance provides the base for component-specific theming. Magicast designer can however modify single component's styles and CSS classes from XML. Layer's implementation should be enough to handle most of the cases.

## Requirements handling ##

Sometimes component have requirements against the execution environment. For example components providing camera functionality are quite useless in environments without camera support.

There's a mechanism to provide information about the component's requirements, so that the MagicasterJS framework can handle the component properly. However the component developer should note that each individual requirement should have the relevant recognition support in `MCCapabilities` object. Without the support for detecting the existence of the feature it's impossible to load and show component requiring that specific feature.

On the other hand nothing mandates the component developer to expose the requirements to the framework. If absolutely mandatory the component can handle the exceptions internally and behave differently in different execution environments.

## Custom component examples ##

MagicasterJS sources contain multiple different components, which are having quite different complexity levels. Component developer should study these to get familiar with the framework and core concepts.

There are also couple of custom components for testing and educational purposes:

- Flickr contains AJAX logic to get information from Flickr service
- Timer provides simple interval support for magicasts via events

Note that these components do not have any specific user interface, so they are logically background services. It's easy to find different use cases where magicast containing both user interface components and background service components can provide rich user experience.


