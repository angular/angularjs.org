#! /bin/sh
set -e


# returns e.g. 1.2.8
function getAngularVersions {
  VERSION_PATTERN=$1
  # result of ls-remote
  # e.g. 0f9a1c21e6d7c57dc02842efa9612a1a70993146 refs/tags/v1.2.8^{}
  # e.g. a7a660b65bceb7c93579469047b332e040afdf5b refs/tags/v1.2.9
  git ls-remote https://github.com/angular/angular.js.git | while read line
  do
    if [[ $line =~ v([0-9].*[0-9])$ ]]; then
      # a line like ...v1.2.9
      # remove 'v' at begin of tag
      # e.g. v1.3.0 -> 1.3.0
      VERSION=${BASH_REMATCH[1]}
      if [[ $VERSION == $VERSION_PATTERN ]]; then
        log "found tag for $VERSION_PATTERN: $VERSION"
        echo $VERSION
      fi
    fi
  done
}

function sortBySemVer {

  function sortBySortId() {
    # e.g. 1.3.0.beta.1
    # e.g. 1.3.0.zzz.99
    sort -t"." -k1,1nr -k2,2nr -k3,3nr -k4,4r -k5,5nr
  }

  function addSortId {
    while read VERSION
    do
      SORT_ID=$VERSION
      # add -zzz.99 to non pre release versions
      # e.g. 1.3.0 -> 1.3.0-zzz.99
      if [[ $SORT_ID != *-* ]]; then
        SORT_ID="$SORT_ID-zzz.99"
      fi
      # replace "-"" with ".""
      # e.g. 1.3.0-beta.2 -> 1.3.0.beta.2
      SORT_ID=${SORT_ID//-/.}

      # e.g. 1.3.0.zzz.99:1.3.0
      # e.g. 1.3.0.beta.2:1.3.0-beta.2
      echo "$SORT_ID:$VERSION"
    done
  }

  function removeSortId {
    while read line
    do
      # get the part after the first colon (i.e. remove sortId)
      # e.g. 1.3.0.beta.99:1.3.0 -> 1.3.0
      echo ${line#*:}
    done
  }

  addSortId | sortBySortId | removeSortId
}

function checkCDN {
  while read VERSION
  do
    STATUS_CODE=$(curl http://ajax.googleapis.com/ajax/libs/angularjs/$VERSION/angular.min.js \
                  --head --write-out '%{http_code}' -o /dev/null -silent)

    log "Checking version $VERSION on CDN: $STATUS_CODE"
    if [[ $STATUS_CODE == "200" ]]; then
      echo $VERSION
      return
    fi
  done
  log "No CDN version found"
  exit 1
}

function log() {
  echo "$@" >&2
}

# replaceInFile(file, findText, replaceText)
function replaceInFile {
  sed -i .tmp "s/$2/$3/" $1
  rm $1.tmp
}

BRANCH=$1
if [[ ! BRANCH ]]; then
  log "Usage: $0 <BRANCH>, e.g. $0 1.2"
  exit 1
fi

getAngularVersions "${BRANCH}.*" | sortBySemVer| checkCDN
