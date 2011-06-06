#!/bin/sh
# Shell script for generating appcache.manifest from appcache.manifest.tpl
# To be used as git pre-commit hook
#
# To install as git pre-commit hook:
# >> cp build-manifest.sh .git/hooks/pre-commit
#
# Or create a symlink
# >> ln -s ../../build-manifest.sh .git/hooks/pre-commit

# new line which works both on Mac and Linux
NL="\\
"

# FUNCTION
# reads all files from given path
# and appends them into global $FILES variable
readFileNames() {
  FILES="$FILES$NL# $1$NL"
  for FILE in $(ls $1)
  do
    FILES="$FILES$FILE$NL"
  done
}

# read all the file names
FILES="# auto-generated file list"
readFileNames "js/*.js"
readFileNames "css/*.css"
readFileNames "img/*"
FILES="$FILES# end of auto-generated file list"

# replace timestamp and file list and output to appcache.manifest
TIMESTAMP=`date -u`
sed "s;%TIMESTAMP%;$TIMESTAMP;" dev/appcache/manifest.tpl | sed "s;%FILES%;$FILES;" > appcache.manifest

# stage the changes so that they are part of the commit
git stage appcache.manifest
