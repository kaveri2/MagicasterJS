@ECHO OFF
md ..\apidoc
call apidoc_tutorials.cmd && call ..\node_modules\.bin\jsdoc.cmd -r ..\src\ -d ..\apidoc\ -t apidoc_templates\docstrap -u apidoc_tutorials\jsdoc -c apidoc.conf -p ..\README.md || call jsdoc -r ..\src\ -d ..\apidoc\ -u apidoc_tutorials\jsdoc -c apidoc.conf -p ..\README.md