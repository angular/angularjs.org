#!/bin/sh
set -ex
shopt -s extglob

CDN_REPLACE_FILES=(
  build/index.html
  build/js/download-data.js
)

function copySrcToBuild {
  rm -rf build/
  mkdir build/

  cp -r src/ build/
}

# replaceInFile(file, findText, replaceText)
function replaceInFile {
  sed -i .tmp "s/$2/$3/" $1
  rm $1.tmp
}

function getCdnVersions {
  CDN_VERSION_1_2=$(./get-cdn-version.sh 1.2)
  CDN_VERSION_1_3=$(./get-cdn-version.sh 1.3)
}

function replaceCdnVersionInFiles {
  for FILE in "${CDN_REPLACE_FILES[@]}"
  do
    replaceInFile $FILE '${CDN_VERSION_1_2}' $CDN_VERSION_1_2
    replaceInFile $FILE '${CDN_VERSION_1_3}' $CDN_VERSION_1_3
  done
}



function testBuildResult {
  export ANGULAR_HOME_HOST='http://localhost:8080';
  export ANGULAR_DOWNLOAD_VERSIONS="$CDN_VERSION_1_2:1.2.x $CDN_VERSION_1_3:1.3.x"
  export ANGULAR_VERSION="$CDN_VERSION_1_3"
  export CHECK_SCRIPT_TAG="true"

  function killServer () {
    kill $serverPid
  }

  npm install .
  ./node_modules/.bin/webdriver-manager update

  # Start basic webserver to serve the app
  ./node_modules/.bin/http-server build/ &
  serverPid=$!

  trap killServer EXIT

  ./node_modules/.bin/protractor protractorConf.js
}

function moveBuildToDist {
  branch=$(git rev-parse --abbrev-ref HEAD)
  git checkout dist
  rm -rf !(build)
  cp -rf build/* .
  rm -rf build
  git add . -A
  git commit --allow-empty -m "update site from src"
  git checkout $branch
}

copySrcToBuild
getCdnVersions
replaceCdnVersionInFiles
testBuildResult
moveBuildToDist
