#!/bin/bash
# Script to be run by the automated release script to verify that the app is
# working as expected with proper versions.
# Ordered Arguments:
# 1. Exact version to check to be contained within CDN url (required)
# 2. Branch name as 1.2.x or 1.3.x. This value is used to click the proper
#    button in the download modal to populate the CDN URL.
# 3. Check script tag (optional, boolean). If true, will check the script tag
#    containing the angular.js library to make sure its src matches the latest
#    version.
# Example:
#   ./e2etest.sh 1.3.0-beta.2 1.3.x true

export ANGULAR_HOME_HOST='http://localhost:8080';
export ANGULAR_VERSION=$1
export ANGULAR_BRANCH=$2
export CHECK_SCRIPT_TAG=$3

npm install .
./node_modules/.bin/webdriver-manager update

# Start basic webserver to serve the app
./node_modules/.bin/http-server build/ &
serverPid=$!

./node_modules/.bin/protractor protractorConf.js
protractorExitCode=$?

# Kill http-server
kill $serverPid

exit $protractorExitCode
