exports.config = {
  baseUrl: process.env.ANGULAR_HOME_HOST || 'http://angularjs.org',
  capabilities: {
    'browserName': 'chrome'
  },
  directConnect: true,
  specs: [
    'test/angularjs.org.spec.js',
  ]
};
