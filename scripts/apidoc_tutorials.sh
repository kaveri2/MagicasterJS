#!/bin/bash
SOURCE="apidoc_tutorials/*.md"
DESTINATION="apidoc_tutorials/jsdoc/"
mkdir -p "$DESTINATION"

for i in ${SOURCE}; do
filename=`basename "$SOURCE$i" .md`
destfile="$DESTINATION$filename.html"
../node_modules/marked/bin/marked "$i" > "$destfile"
echo "$destfile" created
done

mkdir ../apidoc/images
cp apidoc_tutorials/images/* ../apidoc/images