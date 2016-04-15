'use strict';

// Imports
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

// Variables - Private
const exec = childProcess.exec;
const spawn = childProcess.spawn;

// Exports
module.exports = {
  copyContent,
  createDir,
  execAsPromised,
  finallyAsPromised,
  getExecutable,
  keepOnly,
  killProcess,
  removeDir,
  removeFile,
  replaceInFile,
  spawnAsPromised,
  traverseDir
};

// Functions - Definitions
function copyContent(srcDir, dstDir, notIgnoreHidden) {
  return traverseDir(srcDir, fileCallback, {pre: dirCallback});

  // Helpers
  function dirCallback(dirPath) {
    return (!notIgnoreHidden && isHidden(dirPath)) ?
      Promise.resolve(true) :
      createDir(dirPath.replace(srcDir, dstDir));
  }

  function fileCallback(filePath) {
    return (!notIgnoreHidden && isHidden(filePath)) ?
      Promise.resolve() :
      new Promise((resolve, reject) => {
        const dstPath = filePath.replace(srcDir, dstDir);

        fs.readFile(filePath, (err, data) => {
          if (err) return reject(err);

          fs.writeFile(dstPath, data, err => err ? reject(err) : resolve());
        });
      });
  }
}

function createDir(dir, failIfExists) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, err => {
      if (err && (failIfExists || (err.code !== 'EEXIST'))) reject(err);

      resolve();
    });
  });
}

function execAsPromised(cmd, options) {
  let proc;
  const promise = new Promise((resolve, reject) => {
    proc = exec(cmd, options, (err, stdout) => {
      if (err) return reject(err);

      resolve(stdout);
    });
  });

  promise.$$process = proc;

  return promise;
}

function finallyAsPromised(promise, callback) {
  return promise.then(runCallback('resolve'), runCallback('reject'));

  // Helpers
  function runCallback(returnMethod) {
    return arg => {
      const onDone = () => Promise[returnMethod](arg);

      return Promise.resolve(callback()).then(onDone, onDone);
    };
  }
}

function getExecutable(name, isGlobal) {
  const suffix = isWindows() ? '.cmd' : '';
  const prefix = isGlobal ? '' : path.join('node_modules', '.bin');

  return `${path.join(prefix, name)}${suffix}`;
}

function ignoreMissing(err) {
  if (err.code === 'ENOENT') {
    console.warn(`Ignoring error: ${err}\n ${err.stack || ''}`);
    return Promise.resolve();
  }

  return Promise.reject(err);
}

function isHidden(fileOrDir) {
  return path.basename(fileOrDir)[0] === '.';
}

function isWindows() {
  return process.platform === 'win32';
}

function keepOnly(fileOrDir, notIgnoreHidden) {
  return new Promise((resolve, reject) => {
    const absPath = path.resolve(fileOrDir);
    const parentDir = path.dirname(absPath);

    fs.readdir(parentDir, (err, items) => {
      if (err) return reject(err);

      let itemsToRemove = items.filter(item => path.resolve(item) !== absPath);
      if (!notIgnoreHidden) itemsToRemove = itemsToRemove.filter(item => !isHidden(item));

      Promise.
        all(itemsToRemove.map(item => new Promise((resolve, reject) => {
          fs.lstat(item, (err, stat) => {
            if (err) return ignoreMissing(err).then(resolve, reject);

            const promise = stat.isDirectory() ? removeDir(item) : removeFile(item);
            promise.catch(ignoreMissing).then(resolve, reject);
          });
        }))).
        then(resolve, reject);
    });
  });
}

function killProcess(proc) {
  const pid = proc.pid;
  const cmd = (isWindows() ? 'taskkill /t /f /pid ' : 'kill -f ') + pid;

  return spawnAsPromised(cmd);
}

function replaceInFile(valuePlaceholderMap, filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, text) => {
      if (err) return reject(err);

      const newText = Object.
        keys(valuePlaceholderMap).
        reduce((text, value) => text.replace(valuePlaceholderMap[value], value), text);

      fs.writeFile(filePath, newText, err => err ? reject(err) : resolve());
    });
  });
}

function removeDir(dir) {
  return traverseDir(dir, removeFile, removeEmptyDir, ignoreMissing).
    catch(ignoreMissing);

  // Helpers
  function removeEmptyDir(emptyDir) {
    return new Promise((resolve, reject) => {
      fs.rmdir(emptyDir, err => err ? reject(err) : resolve());
    });
  }
}

function removeFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, err => err ? reject(err) : resolve());
  });
}

function spawnAsPromised(cmd, options) {
  let proc;
  const promise = new Promise((resolve, reject) => {
    const parsedCmd = parseCmd(cmd);

    const executable = parsedCmd.executable;
    const args = parsedCmd.args;
    options = options || {stdio: 'inherit'};

    proc = spawn(executable, args, options).
      on('error', reject).
      on('exit', (code, signal) => (code !== 0) ? reject(code || signal) : resolve());
  });

  promise.$$process = proc;

  return promise;

  // Helpers
  function parseCmd(cmd) {
    const tokens = Array.isArray(cmd) ? cmd : cmd.
      split('"').
      reduce((arr, str, idx) => arr.concat((idx % 2) ? `"${str}"` : str.split(' ')), []).
      filter(Boolean);

    return {
      executable: tokens[0],
      args: tokens.slice(1)
    };
  }
}

function traverseDir(dir, fileCallback, dirCallback, errInterceptor) {
  const resolve = () => Promise.resolve();
  const reject = err => Promise.reject(err);

  if (!errInterceptor) errInterceptor = reject;
  dirCallback = {
    pre: dirCallback.pre || resolve,
    post: (typeof dirCallback === 'function') ? dirCallback : (dirCallback.post || resolve)
  };

  return dirCallback.pre(dir).
    then(skip => skip ? Promise.resolve() : new Promise((resolve, reject) => {
      fs.readdir(dir, (err, items) => {
        if (err) return errInterceptor(err).then(resolve, reject);

        Promise.
          all(items.map(item => new Promise((resolve, reject) => {
            const curPath = path.join(dir, item);

            fs.lstat(curPath, (err, stat) => {
              if (err) return errInterceptor(err).then(resolve, reject);

              const promise = stat.isDirectory() ?
                traverseDir(curPath, fileCallback, dirCallback, errInterceptor) :
                fileCallback(curPath);

              promise.
                catch(errInterceptor).
                then(resolve, reject);
            });
          }))).
          then(resolve, reject);
      });
    })).
    then(() => dirCallback.post(dir));
}
