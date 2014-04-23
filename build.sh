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
  export ANGULAR_HOME_HOST='http://localhost:8100';
  export ANGULAR_DOWNLOAD_VERSIONS="$CDN_VERSION_1_2:1.2.x $CDN_VERSION_1_3:1.3.x"
  export ANGULAR_VERSION="$CDN_VERSION_1_3"
  export CHECK_SCRIPT_TAG="true"

  function killServer () {
    kill $serverPid
  }

  npm install .
  ./node_modules/.bin/webdriver-manager update

  # Start basic webserver to serve the app
  ./node_modules/.bin/http-server -p 8100 build/ &
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
  # ||true if we had no changes
  git commit -m "update site from src" || true
  git checkout $branch
}

function parseArgs {
  # defaults if no args are given
  if (( $# == 0 )); then
    DO_COPY=1
    DO_TEST=1
  fi

  # parse args
  while (( $# > 0 )); do
    case "$1" in
      (copy) DO_COPY=1 ;;
      (test) DO_TEST=1 ;;
      (dist) DO_DIST=1 ;;
      (*) echo "$0: error - unrecognized option $1" 1>&2; exit 1;;
    esac
    shift
  done
}

# --------------
# main
parseArgs "$@"

if [[ "$DO_COPY" ]]; then
  copySrcToBuild
  getCdnVersions
  replaceCdnVersionInFiles
fi

if [[ "$DO_TEST" ]]; then
  testBuildResult
fi

if [[ "$DO_DIST" ]]; then
  moveBuildToDist
fi
