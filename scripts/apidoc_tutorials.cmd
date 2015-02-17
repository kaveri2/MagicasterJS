@ECHO OFF
setlocal enableextensions enabledelayedexpansion

set SOURCEDIR="apidoc_tutorials\"
set DESTINATION="apidoc_tutorials\jsdoc"
md %DESTINATION%
FOR /F %%i IN (%DESTINATION%) DO set DESTINATION=%%~fi
FOR /F %%i IN (%SOURCEDIR%) DO set SOURCEDIR=%%~fi

set SOURCES=%SOURCEDIR%*.md
for %%i in (%SOURCES%) do (
set destfile=%DESTINATION%%%~ni.html
echo !destfile!
call node ..\node_modules\marked\bin\marked %%~fi > !destfile!

md ..\apidoc\images
copy apidoc_tutorials\images\*.* ..\apidoc\images