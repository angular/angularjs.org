var config = require('./protractorConfShared').config;

config.capabilities = {
  'browserName': 'chrome'
};

config.directConnect = true;

exports.config = config;