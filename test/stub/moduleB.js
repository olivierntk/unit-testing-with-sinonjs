'use strict';

var moduleB = require('../../lib/moduleB');
var moduleC = require('../../lib/moduleC');

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('moduleB', function () {
  describe('greet', function () {
    it('1st example using a stub', function () {
      var stub = sinon.stub(moduleC, 'format');
      stub.returns('Eric')

      var name = 'JaMes ARMStrOng';
      var greetings = moduleB.greet(name);

      expect(moduleC.format).to.have.been.calledOnce;
      expect(moduleC.format).to.have.been.calledWith(name);

      expect(greetings).to.equal('Hello Eric');

      stub.restore();
    });
  });
});
