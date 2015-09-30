var exec = require('child_process').exec,
    http = require('http'),
    TARGET_POOL = 'ng-sites',
    REGION = 'us-central1',
    PROJECT = '435162472401',
    PORT = '8000';

console.log('Beginning propagation to other instances');

exec('dig backends.angularjs.org +short TXT', function (err, result, code) {
  var executed = 0,
      instances;

  if (err) {
    throw new Error(err);
  }

  try {
    var instances = result
      .replace(/"/g,'')
      .replace(/\n/g, '')
      .split(',');

    instances.forEach(function(instance) {
      var reqUrl = 'http://'+ instance +':'+ PORT +'/gitFetchSite.php?doNotPropagate=true';
      console.log('Updating ', reqUrl);
      http.get(reqUrl, function (res) {
        console.log('Finished executing', reqUrl);
        executed++;
        executed === instances.length && process.exit();
      }).on('error', function (err) {
        console.log('Failed to update', reqUrl);
        console.log(err);
        executed++;
        exitCode = 1;
        executed === instances.length && process.exit(exitCode);
      });
      });
  }
  catch (e) {
    console.log('failed to propagate with', e);
    return process.exit(1);
  }
});
