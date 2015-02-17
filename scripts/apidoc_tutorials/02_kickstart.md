
----------
## Overview ##

Following diagram contains the representation of the Magicast kickstart. It is responsible for loading the actual MagicasterJS core including external dependencies.

Kickstart is also responsible for configuring the framework according to the requirements for the running platform. These configuration possibilities are described in Magicast configuration -tutorial.

Kickstart script is custom-made to configure RequireJS on the fly. After RequireJS has been configured properly to meet the environment requirements, RequireJS takes the responsibility of handle the rest of the AMD dependencies within MagicasterJS framework.

## Configuration ##

The default kickstart should be treated as example implementation, although fully functional one. Different MagicasterJS installations can (and most likely) will have different configurations regarding asset resolvers and things like that.