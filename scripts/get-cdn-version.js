'use strict';

// Imports
const exec = require('child_process').exec;
const http = require('http');

const utils = require('./utils');

// Constants
const GIT_REMOTE = 'https://github.com/angular/angular.js.git';
const VERSION_REGEXP = /^(\d+)\.(\d+)\.(\d+)(?:-([^.]+)\.(\d+))?$/;

// Exports
module.exports = getCdnVersion;

// Functions - Definitions
function checkCdn(versions) {
  return new Promise((resolve, reject) => {
    checkVersionOnCdn(0);

    // Helpers
    function checkVersionOnCdn(idx) {
      if (idx >= versions.length) reject('`checkCdn`: No version found on CDN');

      const version = versions[idx];

      const reqConfig = {
        method: 'HEAD',
        protocol: 'http:',
        hostname: 'ajax.googleapis.com',
        path: `/ajax/libs/angularjs/${version}/angular.min.js`
      };
      const reqCallback = res => {
        const statusCode = res.statusCode;

        console.log(`  Checking version ${version} on CDN: ${statusCode}`);
        if (statusCode === 200) return resolve(version);

        checkVersionOnCdn(idx + 1);
      };

      http.request(reqConfig, reqCallback).end();
    }
  });
}

function getAngularVersions(version) {
  // Sample output of `git ls-remote`:
  // ...
  // 92cb6eb5ef3a43ab569c80ccddd634c0f7a85e38  refs/tags/v1.5.2
  // f665968dafdc2e1f8fdd3ee466feecbdb137ee5d  refs/tags/v1.5.2^{}
  // cfffd1cd5607c0df03720614221c6b0e9c3e8189  refs/tags/v1.5.3
  // 514639b585affc218a6899f1b1755863647fa5a8  refs/tags/v1.5.3^{}
  // ...
  const versionRegExp = new RegExp(`v(${version.replace(/\./g, '\\.')}\\..*\\d)\\s*$`, 'gi');

  return utils.
    execAsPromised(`git ls-remote --tags ${GIT_REMOTE}`).
    then(extractMatchingVersions);

  //Helpers
  function extractMatchingVersions(output) {
    return output.
      split('\n').
      map(line => versionRegExp.exec(line)).   // '... refs/tags/vX.Y.Z'  -->  'X.Y.Z'
      filter(Boolean).
      map(match => {
        const v = match[1];
        console.log(`  Found version for ${version}.*: ${v}`);

        return v;
      });
  }
}

function getCdnVersion(version) {
  if (!version) return Promise.reject('`getCdnVersion`: No version specified');

  return getAngularVersions(version).
    then(sortBySemver).
    then(checkCdn);
}

function sortBySemver(versions) {
  return versions.
    map(parseVersion).
    sort(sortReverse).
    map(o => o.version);

  // Helpers
  function parseVersion(version) {
    const match = VERSION_REGEXP.exec(version);
    const tokens = [
      /* major */ +match[1],
      /* minor */ +match[2],
      /* patch */ +match[3],
      /* pre-1 */ match[4] || 'zzz',
      /* pre-2 */ +(match[5] || 99)
    ];

    return {version, tokens};
  }

  function sortReverse(a, b) {
    const tokensA = a.tokens;
    const tokensB = b.tokens;

    for (let i = 0, ii = tokensA.length; i < ii; i++) {
      const valueA = tokensA[i];
      const valueB = tokensB[i];

      if (valueA < valueB) return +1;
      if (valueA > valueB) return -1;
    }
  }
}
