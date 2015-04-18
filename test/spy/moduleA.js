'use strict';

var moduleA = require('../../lib/moduleA');

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('moduleA', function () {

  describe('greet', function () {
    var logger;

    it('1st example using a spy', function () {
      logger = {
        log: sinon.spy()
      };

      var greetings = moduleA.greet('James', logger);

      expect(logger.log).to.have.been.calledOnce;
      expect(logger.log).to.have.been.calledWith('Greeting: James');

      expect(greetings).to.equal('Hello James');

      logger.log.reset();
    });

    it('2nd example using a spy', function () {
      logger = {
        log: function (msg) {
          console.log(msg);
        }
      };

      sinon.spy(logger, 'log');

      var greetings = moduleA.greet('James', logger);

      expect(logger.log).to.have.been.calledOnce;
      expect(logger.log).to.have.been.calledWith('Greeting: James');

      expect(greetings).to.equal('Hello James');

      logger.log.restore();
    });

  });

});
