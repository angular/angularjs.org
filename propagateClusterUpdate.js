var exec = require('child_process').exec,
    http = require('http'),
    TARGET_POOL = 'ng-sites',
    REGION = 'us-central1',
    PROJECT = '435162472401',
    PORT = '8000';

console.log('Beginning propagation to other instances');

exec('gcutil gettargetpool '+ TARGET_POOL +' --project='+ PROJECT +' --region='+ REGION +' --format=json', function (err, result, code) {
  var instanceIPs = [],
      executed = 0,
      instances;

  if (err) {
    throw new Error(err);
  }

  try {
    targetPool = JSON.parse(result);
    instances = targetPool.instances;
  }
  catch (e) {
    console.error('Could not parse target pool');
    return process.exit(1);
  }


  instances.forEach(function (instance) {
    var name = /^.*\/([a-zA-Z\-0-9]*)$/.exec(instance)[1];

    exec('gcutil getinstance '+ name +' --format=json --project='+ PROJECT, function (err, result, code) {
      var instance, reqUrl, exitCode = 0;

      if (err) {
        console.error(err);
        return process.exit(code);
      }

      try {
        instance = JSON.parse(result);
        console.log('instance', instance);
        instance.networkInterfaces.forEach(function (netInt) {
          if (reqUrl) return;

          console.log('netInt', netInt);

          netInt.accessConfigs.forEach(function (config) {
            console.log('config', config, config.natIP);
            if (config.natIP) reqUrl = 'http://'+ config.natIP +':'+ PORT +'/gitFetchSite.php?doNotPropagate=true';
            console.log('reqUrl', reqUrl);
          });
        });
      }
      catch (e) {
        console.error(e);
        return process.exit(1);
      }

      console.log('Updating remote instance: ', reqUrl);

      http.get(reqUrl, function (res) {
        console.log('Finished executing', reqUrl);
        executed++;
        executed === instanceIPs.length && process.exit(exitCode);
      }).on('error', function (err) {
        console.error('Failed to update', reqUrl);
        console.error(err);
        executed++;
        exitCode = 1;
        executed === instanceIPs.length && process.exit(exitCode);
      });
    });
  });
});
