'use strict';

// Imports
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const getCdnVersion = require('./get-cdn-version');
const utils = require('./utils');

// Constants
const ROOT_DIR = '.';
const DST_DIR = 'build';
const SRC_DIR = 'src';
const CDN_VERSIONS = ['1.2', '1.5', '1.6'];
const CDN_REPLACE_FILES = ['index.html', 'js/download-data.js'];
const GIT_BRANCH_DIST = 'dist';
const PTOR_CONF = 'protractorConf.js';
const PTOR_PORT = '8100';
const PTOR_ENV = {
  ANGULAR_HOME_HOST: `http://localhost:${PTOR_PORT}`,
  ANGULAR_DOWNLOAD_VERSIONS: '-',
  ANGULAR_VERSION: '-',
  CHECK_SCRIPT_TAG: 'true'
};

// Variables - Private
const args = process.argv.slice(2);
const actions = parseArgs(args);

// Run
_main(actions);

// Functions - Definitions
function _main(actions) {
  const callbacks = [];

  if (actions.copy) {
    callbacks.push(copySource, getCdnVersions, updateProtractorEnv, replaceCdnVersionsInFiles);
  }

  if (actions.test) {
    callbacks.push(testBuild);
  }

  if (actions.dist) {
    callbacks.push(updateDist);
  }

  return callbacks.
    reduce((promise, cb) => promise.then(cb), Promise.resolve()).
    catch(onError);
}

function announce(message) {
  const ruler = new Array(81).join('-');
  console.log(`${ruler}\n${message}\n`);
}

function copySource() {
  announce(`Copying source files from '${SRC_DIR}' to '${DST_DIR}'...`);

  return Promise.resolve().
    then(() => utils.removeDir(DST_DIR)).
    then(() => utils.createDir(DST_DIR)).
    then(() => utils.copyContent(SRC_DIR, DST_DIR));
}

function getCdnVersions() {
  announce(`Getting the latest versions available on CDN...`);

  return Promise.all(CDN_VERSIONS.map(getCdnVersion));
}

function mapVersionsToPlaceholders(cdnVersions) {
  return cdnVersions.reduce((map, v) => {
    const tokens = v.split('.');
    map[v] = new RegExp(`\\\${CDN_VERSION_${tokens[0]}_${tokens[1]}}`, 'g');

    return map;
  }, {});
}

function onError(err) {
  const cmd = `build${args.length ? ' ' + args.join(' ') : ''}`;
  if (isFinite(err)) err = `Exit code: ${err}`;

  console.error(`ERROR (running '${cmd}'): ${err}\n ${err.stack || ''}`);

  process.exit(1);
}

function parseArgs(args) {
  var actions = {
    copy: false,
    test: false,
    dist: false
  };

  if (!args.length) {
    actions.copy = true;
    actions.test = true;
  } else {
    args.forEach(arg => {
      switch (arg) {
        case 'copy':
        case 'test':
        case 'dist':
          actions[arg] = true;
          break;
        default:
          onError(`unrecognized option ${arg}`);
          break;
      }
    });
  }

  return actions;
}

function replaceCdnVersionsInFiles(cdnVersions) {
  announce(`Replacing CDN versions in files (${CDN_REPLACE_FILES.join(', ')})...`);

  const versionMap = mapVersionsToPlaceholders(cdnVersions);
  const replaceVersionsInFile = file => {
    const filePath = path.join(DST_DIR, file);
    return utils.replaceInFile(versionMap, filePath);
  };

  return Promise.all(CDN_REPLACE_FILES.map(replaceVersionsInFile));
}

function testBuild() {
  announce(`Testing the current build (ENV: ${JSON.stringify(PTOR_ENV, null, 2)})...`);

  const npmInstallCmd = `${utils.getExecutable('npm', true)} install`;
  const wdrManagerCmd = `${utils.getExecutable('webdriver-manager')} update`;
  const httpServerCmd = `${utils.getExecutable('http-server')} -p ${PTOR_PORT} ${DST_DIR}`;
  const protractorCmd = `${utils.getExecutable('protractor')} ${PTOR_CONF}`;

  const protractorOptions = {
    env: Object.assign(process.env, PTOR_ENV),
    stdio: 'inherit'
  };

  const npmInstallPromise = chain(Promise.resolve(), npmInstallCmd);
  const wdrManagerPromise = chain(npmInstallPromise, wdrManagerCmd);
  const httpServerPromise = chain(wdrManagerPromise, httpServerCmd);
  const protractorPromise = chain(wdrManagerPromise, protractorCmd, protractorOptions);

  const killHttpServer = () => httpServerPromise.$$killProcess();

  return utils.finallyAsPromised(protractorPromise, killHttpServer);

  // Helpers
  function chain(promise, cmd, options) {
    let innerPromise;

    promise = promise.then(() => innerPromise = utils.spawnAsPromised(cmd, options));
    promise.$$killProcess = () => innerPromise && utils.killProcess(innerPromise.$$process);

    return promise;
  }
}

function updateDist() {
  announce(`Updating '${GIT_BRANCH_DIST}' branch with the current build...`);

  return utils.
    execAsPromised('git rev-parse --abbrev-ref HEAD').
    then(originalBranch => {
      const restoreBranch = () => utils.spawnAsPromised(`git checkout ${originalBranch.trim()}`);

      const promise = Promise.resolve().
        then(() => utils.spawnAsPromised(`git checkout ${GIT_BRANCH_DIST}`)).
        then(() => utils.keepOnly(DST_DIR)).
        then(() => utils.copyContent(DST_DIR, ROOT_DIR)).
        then(() => utils.removeDir(DST_DIR)).
        then(() => utils.spawnAsPromised(`git add --all ${ROOT_DIR}`)).
        then(() => utils.spawnAsPromised('git commit -m "update site from src"').catch(() => {}));

      return utils.finallyAsPromised(promise, restoreBranch);
    });
}

function updateProtractorEnv(cdnVersions) {
  announce(`Updating version-related environmental variables (for Protractor)...`);

  PTOR_ENV.ANGULAR_VERSION = cdnVersions[cdnVersions.length - 1];
  PTOR_ENV.ANGULAR_DOWNLOAD_VERSIONS = cdnVersions.
    map((cdnVersion, idx) => `${cdnVersion}:${CDN_VERSIONS[idx]}.x`).
    join(' ');

  return cdnVersions;
}
