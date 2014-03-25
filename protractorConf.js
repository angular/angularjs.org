exports.config = {
  seleniumServerJar: './node_modules/protractor/selenium/selenium-server-standalone-2.40.0.jar',
  seleniumArgs: [],
  baseUrl: process.env.ANGULAR_HOME_HOST || 'http://angularjs.org',
  capabilities: {
    'browserName': 'chrome'
  },
  specs: [
    'test/angularjs.org.spec.js',
  ],
  jasmineNodeOpts: {
    onComplete: null,
    isVerbose: true,
    showColors: false,
    includeStackTrace: true,
    defaultTimeoutInterval: 10000
  }
};