var exec = require('child_process').exec;

console.log('Beginning propagation to other instances');

exec('gcutil listinstances --format=json --project=435162472401', function (err, result, code) {
  var instanceIPs = [],
      executed = 0;

  if (err) {
    throw new Error(err);
  }

  var regions = JSON.parse(result).items;

  Object.keys(regions).forEach(function (key) {
    var instances = regions[key].instances;
    if (Array.isArray(instances)) {
      instances.forEach(function (instance) {
        instance.networkInterfaces && instance.networkInterfaces.forEach(function (netInt) {
          netInt.accessConfigs &&
            netInt.accessConfigs[0] &&
            parseInt(netInt.accessConfigs[0].natIP, 10) &&
            instanceIPs.push(netInt.accessConfigs[0].natIP);
        });
      });
    }
  });

  instanceIPs.forEach(function (ip) {
    var reqUrl = 'http://' + ip + ':8000/gitFetchSite.php?doNotPropagate=true';
    console.log('Updating remote instance: ', reqUrl);

    exec('curl ' + reqUrl, function (err, result, code) {
      console.log('Finished executing', reqUrl);
      executed++;
      executed === instanceIPs.length && process.exit(code);
    });
  });
});
