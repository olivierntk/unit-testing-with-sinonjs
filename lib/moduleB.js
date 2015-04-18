var moduleC = require('./moduleC');

module.exports = {
  greet: function (name) {
    var formattedName = moduleC.format(name);
    return 'Hello ' + formattedName;
  }
};
