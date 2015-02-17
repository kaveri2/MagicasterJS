#!/bin/bash
mkdir ../apidoc
./apidoc_tutorials.sh && ../node_modules/.bin/jsdoc -r ../src/ -d ../apidoc/ -t apidoc_templates/docstrap -u apidoc_tutorials/jsdoc -c apidoc.conf -p ../README.md
