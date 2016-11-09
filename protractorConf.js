exports.config = {
  baseUrl: process.env.ANGULAR_HOME_HOST || 'http://angularjs.org',
  capabilities: {
    'browserName': 'chrome'
  },
  directConnect: true,
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
