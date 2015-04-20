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
    it('should return an error message if the authentication fails', function (done) {
      // setup:
      var error = new Error('Authentication failed.');
      stub.callsArgWithAsync(1, error);

      // when:
      authenticationService.login(req, res);

      // then:
      process.nextTick(function () {
        expect(res.send).to.have.been.calledWith(error.message);
        done();
      });
    });

    it('should return the user if the authentication succeeds', function (done) {
      // setup:
      var userFixture = {id: 123, name: 'Obi one'};
      stub.callsArgWithAsync(1, null, userFixture);

      // when:
      authenticationService.login(req, res);

      // then:
      process.nextTick(function(){
        expect(res.send).to.have.been.calledWith(userFixture);
        done();
      });
    });
  });

  describe('loginWithCallback', function () {
    it('should return an error message if the authentication fails', function (done) {
      // setup:
      var error = new Error('Authentication failed.');
      stub.callsArgWithAsync(1, error);

      // when:
      authenticationService.loginWithCallback(req, res, function (err, result) {
        expect(err.message).to.equal(error.message);
        done();
      });
    });

    it('should return the user if the authentication succeeds', function (done) {
      // setup:
      var userFixture = {id: 123, name: 'Obi one'};
      stub.callsArgWithAsync(1, null, userFixture);

      // when:
      authenticationService.loginWithCallback(req, res, function (error, user) {
        expect(user).to.equal(userFixture);
        done();
      });
    });
  });
});
