var exec = require('child_process').exec,
    http = require('http'),
    TARGET_POOL = 'ng-sites',
    REGION = 'us-central1',
    PROJECT = '435162472401',
    PORT = '8000';

console.log('Beginning propagation to other instances');

exec('gcutil gettargetpool '+ TARGET_POOL +' --project='+ PROJECT +' --region='+ REGION +' --format=json', function (err, result, code) {
  var executed = 0,
      instances;

  if (err) {
    throw new Error(err);
  }

  try {
    targetPool = JSON.parse(result);
    instances = targetPool.instances;
  }
  catch (e) {
    console.log('Could not parse target pool');
    return process.exit(1);
  }


  instances.forEach(function (instance) {
    var name = /^.*\/([a-zA-Z\-0-9]*)$/.exec(instance)[1];

    exec('gcutil getinstance '+ name +' --format=json --project='+ PROJECT, function (err, result, code) {
      var instance, reqUrl, exitCode = 0;

      if (err) {
        console.log(err);
        return process.exit(code);
      }

      try {
        instance = JSON.parse(result);
        instance.networkInterfaces.forEach(function (netInt) {
          if (reqUrl) return;
          if (netInt.networkIP) reqUrl = 'http://'+ netInt.networkIP +':'+ PORT +'/gitFetchSite.php?doNotPropagate=true';
        });
      }
      catch (e) {
        console.log(e);
        return process.exit(1);
      }

      if (!reqUrl) {
        return console.log('Could not find any URL for instance', instance);
      }

      console.log('Updating remote instance: ', reqUrl);

      http.get(reqUrl, function (res) {
        console.log('Finished executing', reqUrl);
        executed++;
        executed === instances.length && process.exit(exitCode);
      }).on('error', function (err) {
        console.log('Failed to update', reqUrl);
        console.log(err);
        executed++;
        exitCode = 1;
        executed === instances.length && process.exit(exitCode);
      });
    });
  });
});
