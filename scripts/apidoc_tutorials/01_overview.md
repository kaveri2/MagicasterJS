----------
MagicasterJS is a HTML5/CSS3/JS -framework developed to provide rich interactive content for the hosting web pages such as blogs and content management systems (CMS).

MagicasterJS predecessor was implemented using Flash technology. HTML5 implementation uses the same basic principles, but contains also more advanced functionality. For example, in Flash implementation there is support for only individual Magicasts. MagicasterJS supports Magicasts, which can also interact with each other.

Magicasts are designed with custom design tool using Magicaster CMS. The output from this tool is an XML data, which is then used by MagicasterJS to dynamically create the required UI elements and interactions. More or less same XML syntax is used both in Flash and MagicasterJS implementations.

## Terms and definitions ##

Here are the most important terms and definitions used in MagicasterJS context.

- **MagicasterJS** - Name for the HTML5/CSS3/JS -framework implementing the Magicast functionality.
- **Magicaster**- Magicaster root object. Responsible for analysing the page, finding the Magicast containers and instantiating Magicast objects.
- **Magicast container** - DOM container on a page (usually a DIV element), where a Magicast object is instantiated. One page can contain multiple Magicast containers.
- **Magicast object** - Reprensentation of the single Magicast. One page can contain multiple Magicast objects.
- **Magicast data** - Magicast objects's data in XML/JSON format, containing the Magicast logic.
- **Node** - Node defines one state/phase in Magicast's lifecycle.
- **Trigger** - Triggers join events to actions.
- **Event**	- Event defines the start of the trigger. Events are fired by components and can exist without triggers.
- **Action** - Action is the functionality which fulfills the trigger execution. Example actions are changeNode, changeProperty and setVariable.
- **Layer** - UI element of Magicast, which is positioned by Magicast's layout manager. Layer contains (normally) one component.
- **Component**	- Low-level entity such like image, audio or video. New components can be developed and introduced dynamically.
- **Asset** - File locator, alternative to URL. Assets are resolved to URL format by assetResolvers.
- **AMD**	- Asynchronous Module Definition. Javascript API for defining modules. For more information see Wikipedia article.