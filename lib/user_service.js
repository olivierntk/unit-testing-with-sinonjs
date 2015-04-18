'use strict';

module.exports = {
  findById: function (id, cb) {
    // simulate async call to DB with 1 user
    process.nextTick(function () {
      if (id !== 123) {
        var error = new Error('User not found');
        return cb(error);
      } else {
        return cb(null, {id: 123, name: 'Obi-wan'});
      }
    });
  }
};
