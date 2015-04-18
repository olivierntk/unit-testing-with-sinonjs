'use strict';

var authenticationService = require('../../lib/authentication_service');
var userService = require('../../lib/user_service');

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('AuthenticationService', function () {
  var req, res, stub;

  req = {
    body: {
      userId: 123
    }
  };

  beforeEach(function () {
    res = {
      send: sinon.spy()
    };

    stub = sinon.stub(userService, 'findById');
  });

  afterEach(function () {
    res.send.reset();
    stub.restore();
  });

  describe('login', function () {
    it('should return an error message if the authentication fails', function () {
      // setup:
      var error = new Error('Authentication failed.');
      stub.callsArgWith(1, error);

      // when:
      authenticationService.login(req, res);

      // then:
      expect(res.send).to.have.been.calledWith(error.message);
    });

    it('should return the user if the authentication succeeds', function () {
      // setup:
      var user = {id: 123, name: 'Obi one'};
      stub.callsArgWith(1, null, user);

      // when:
      authenticationService.login(req, res);

      // then:
      expect(res.send).to.have.been.calledWith(user);
    });
  });

  describe('asyncLogin', function () {
    it('should return an error message if the authentication fails', function (done) {
      // setup:
      var error = new Error('Authentication failed.');
      stub.callsArgWith(1, error);

      // when:
      authenticationService.loginWithCallback(req, res, function (err, result) {
        expect(err).to.equal(error);
        done();
      });
    });

    it('should return the user if the authentication succeeds', function (done) {
      // setup:
      var user = {id: 123, name: 'Obi one'};
      stub.callsArgWith(1, null, user);

      // when:
      authenticationService.loginWithCallback(req, res, function (error, result) {
        expect(result).to.equal(user);
        done();
      });
    });
  });
});
