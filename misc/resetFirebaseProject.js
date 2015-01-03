var FirebaseTokenGenerator = require('firebase-token-generator');
var Firebase = require('firebase');
var Promise = require('promise');

if (process.argv.indexOf('--test') > -1) {
  auth().
    then(log('auth')).
    then(getProjectsRef).
    then(log('getProjectsRef')).
    then(initData).
    then(log('initData')).
    then(addData('before')).
    then(log('addBeforeData')).
    then(addNewMarker).
    then(log('addNewMarker')).
    then(addData('after')).
    then(log('addAfterData')).
    then(cleanupProjects).
    then(log('cleanupProjects')).
    then(addNewMarker).
    then(log('addNewMarker')).
    then(exitClean, exitError);
} else {
  auth().
    then(getProjectsRef).
    then(cleanupProjects).
    then(addNewMarker).
    then(exitClean, exitError);
}

function log(finishedStep) {
  return function(val) {
    console.log('finished', finishedStep);
    return val;
  }
}

function auth() {
  return new Promise(function(resolve, reject) {
    var tokenGenerator = new FirebaseTokenGenerator(process.env.DOTORG_FIREBASE_SECRET);
    var token = tokenGenerator.createToken({
      uid: 'ci.angularjs.org'
    },{
      expires: Math.round(Date.now() / 1000) + 10 * 60 //10 minutes
    });
    var ref = new Firebase("https://ng-projects-list.firebaseio.com/");
    ref.authWithCustomToken(token, function(error, authData) {
      if (error) return reject(error);
      resolve(ref);
    })
  });
}

function getProjectsRef(ref) {
  return new Promise(function(resolve, reject) {
    resolve(ref.child('projects'));
  });
}

function initData (projects) {
  return new Promise(function(resolve, reject) {
    projects.set([], function(err) {
      if (err) return reject(err);
      resolve(projects);
    });
  });
}

function addData(prefix) {
  return function(projects) {
    return new Promise(function(resolve, reject) {
      var count = 0,
          query = projects.orderByChild('timestamp');
      query.on('child_added', function childAdded() {
        if(++count === 10) {
          query.off('child_added', childAdded);
          setTimeout(function() {
            resolve(projects);
          }, 1000);
        }
      });
      for (var i=0; i<10; i++) {
        projects.push({name: prefix+i});
      }
    });
  }
}

function addNewMarker(projects) {
  return new Promise(function(resolve, reject) {
    var date = new Date();
    var fmtDate =
      date.getFullYear() + '-' +
      doubleDigitDate(date.getMonth() + 1) + '-' +
      doubleDigitDate(date.getDate()) + ' ';
    fmtDate +=
      date.getHours() + ':' +
      doubleDigitDate(date.getMinutes()) + ':' +
      doubleDigitDate(date.getSeconds());
    var marker = projects.push({timestamp: Firebase.ServerValue.TIMESTAMP, clientTime: fmtDate}, function(err) {
      if (err) return reject(err);
      resolve(projects);
    });
  });
}

function cleanupProjects(projects) {
  return new Promise(function(resolve, reject) {
    var timeout, cleanupQuery, lastCleanupKey;
    function debounceChildAdded() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(function() {
        projects.off('child_added', deleteSnapshot);
        resolve(projects);
      }, 1000);
    }

    projects.orderByChild('timestamp').limitToLast(1).once('child_added', function(snapshot) {
      if (typeof snapshot.child('timestamp').val() === 'number') {
        lastCleanupKey = snapshot.key();
        cleanupQuery = projects.orderByKey().endAt(lastCleanupKey).on('child_added', deleteSnapshot);
      }
      else {
        console.log('No timestamp marker found, proceeding without cleaning up...');
        resolve(projects);
      }

    });

    function deleteSnapshot(snapshot) {
      snapshot.ref().remove();
      debounceChildAdded();
    }
  });
}

function exitClean(projects) {
  projects.orderByKey().limitToLast(1).on('child_added', function(snapshot) {
    if (snapshot.child('timestamp').val()) {
      console.log('New marker added successfully');
      process.exit(0);
    }
    setTimeout(function() {
      exitError(new Error('Could not verify new marker set successfully'));
    }, 1000);
  });
}

function exitError(error) {
  console.error(error);
  process.exit(1);
}

function doubleDigitDate(input) {
  return ('0'+input).slice(-2);
}
