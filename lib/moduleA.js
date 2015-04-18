'use strict';

// var moduleB = require('./moduleB');

module.exports = {
  greet: function(name, logger) {
    logger.log('Greeting: ' + name);
    return 'Hello ' + name;
  }
};
