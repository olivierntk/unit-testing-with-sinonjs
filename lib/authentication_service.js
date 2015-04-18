var userService = require('./user_service');

module.exports = {
  login: function(req, res) {
    userService.findById(req.body.userId, function (error, user) {
      if (error) {
        return res.send(error.message);
      }

      return res.send(user);
    });
  },

  loginWithCallback: function (req, res, cb) {
    userService.findById(req.body.userId, function (error, user) {
      if (error) {
        return cb(error);
      }

      return cb(null, user);
    });
  }
};
