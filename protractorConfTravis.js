var config = require('./protractorConfShared').config;

config.sauceUser = process.env.SAUCE_USERNAME;
config.sauceKey = process.env.SAUCE_ACCESS_KEY;

config.capabilities = {
  'browserName': 'chrome',
  'version': 70,
  'build': process.env.TRAVIS_BUILD_NUMBER,
  'elementScrollBehavior': 1,
  'name': 'AngularJS.org E2E',
  'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER
};

exports.config = config;
