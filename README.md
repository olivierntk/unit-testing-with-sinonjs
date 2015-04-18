SinonJS is a standalone unit testing library for JavaScript. It provides spies, stubs and mocks. We used it extensively while building our services in Node.js but it also supports objects to test your client side code. We found it very useful and easy to use, but its API was not easy to understand at first. In this post, I want to share the lessons learned from using Sinon's spies and stubs.

Notes:
In this project, we are using [mocha] (http://mochajs.org/) as the test runner and [chai] (http://chaijs.com/) to express our tests assertions. Sinon has its own assertion API. We are using the [sinon-chai] module (https://github.com/domenic/sinon-chai) to bridge sinonjs' assertions with chaijs' assertions.

1. Spies
====================

##From SinonJS's docs:

>"A test spy is a function that records arguments, return value, the value of this and exception thrown (if any) for all its calls. A test spy can be an anonymous function or it can wrap an existing function."


1.1 Using spies as an anonymous function: sinon.spy()
---------------------

Let's consider moduleA (under /lib/moduleA.js) and see how we would test it.
In moduleA, the function ```greet``` takes a name and a logger object that has a ```log``` method.
The unit test should verify that the result string is correct and that the logger's log method was called with the appropriate parameter.
In the test below, we constructed a logger object with a log method. Because logger.log is a spy, after we execute the method under test, we can inspect how many times it has been called or which arguments it received.

it('1st example using a spy', function () {
  logger = {
    log: sinon.spy()
  };

  var greetings = moduleA.greet('James', logger);

  expect(logger.log).to.have.been.calledOnce;
  expect(logger.log).to.have.been.calledWith('Greeting: James');

  // Verify the method returns the expected result
  expect(greetings).to.equal('Hello James');

  // Reset the spy so that this test does not affect others.
  logger.log.reset();
});

Note that we called reset on the log method. This clears all state on the spy for the next test.

1.2 Using spies as a function wrapper: sinon.spy(object, "method");
---------------------

You can also use a spy as a wrapper on an existing function. In the example below, we have an implemention of the log function.

    it('2nd example using a spy', function () {
      logger = {
        log: function (msg) {
          console.log(msg);
        }
      };

      // Spying on the log function
      sinon.spy(logger, 'log');

      var greetings = moduleA.greet('James', logger);

      expect(logger.log).to.have.been.calledOnce;
      expect(logger.log).to.have.been.calledWith('Greeting: James');

      expect(greetings).to.equal('Hello James');

      logger.log.restore();
    });

The main difference is that the spy lets the code execute so you will see the log function execute and the message in your console.
The test itself doesn't change except that we are using restore in this scenario.

2. Stubs
====================

##From the docs:
>"Test stubs are functions (spies) with pre-programmed behavior. They support the full test spy API in addition to methods which can be used to alter the stub’s behavior.
As spies, stubs can be either anonymous, or wrap existing functions. When wrapping an existing function with a stub, the original function is not called."

So stubs are spies and can be used the same way (as an anonymous function or wrapping an existing one). They differ by their ability to have a specified behavior and they do NOT let the original method execute.

2.1 Stubbing a dependency: sinon.stub(object, "method")
---------------------

Stubs are particularly useful if you want to isolate the module under test from its dependencies.

Again, let's look at an example. Our moduleB depends on moduleC. To properly unit test moduleB, we want to isolate it from moduleC's internal working to ensure we are just testing moduleB's code.

In '/test/sub/moduleB':

  // require the dependencies
  var moduleC = require('../../lib/moduleC');

  it('1st example using a stub', function () {
    // stub moduleC's format
    var stub = sinon.stub(moduleC, 'format');

    // specify the behavior of moduleC's format method
    stub.returns('Eric')

    var name = 'JaMes ARMStrOng';

    // execute the method under test
    var greetings = moduleB.greet(name);

    // stubs are spies to they have the same recording abilities
    expect(moduleC.format).to.have.been.calledOnce;
    expect(moduleC.format).to.have.been.calledWith(name);

    // because we defined the stub's behavior, moduleC's format
    // method is going to return the string 'Eric' but
    // will not execute
    expect(greetings).to.equal('Hello Eric');

    // restore the stub
    stub.restore();
  });

2.2 Testing asynchronous code
---------------------

When programmers start with Node.js, dealing with asynchronous programming can be confusing and unit testing asynchronous code can be even more so.
But once you get a grasp of sinon's api, it can be quite easy.

Let's look at lib/authentication_service.js. It has a login method which internally uses the asynchronous userService.findById method. findById() takes an id as its first parameter and a function to execute once it receives the data from the userService. The file /test/stub/authentication_service.js shows how we can test it.

First, we are using mocha's hooks to create a res.send spy and userService.findById stub before each tests and reset/restore the spy/stub after each tests.

In the first test, we are testing the error case and in the second one, we are testing the scenario where the userService returns a user:

    describe('login', function () {
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

      it('should return an error message if the authentication fails', function () {
        // setup:
        var error = new Error('Authentication failed.');
        // we are passing an error as the first parameter of the callback
        stub.callsArgWith(1, error);

        // when:
        authenticationService.login(req, res);

        // then:
        expect(res.send).to.have.been.calledWith(error.message);
      });

      it('should return the user if the authentication succeeds', function () {
        // setup:
        var user = {id: 123, name: 'Obi one'};
        // success case: error is null and the service returned a user
        stub.callsArgWith(1, null, user);

        // when:
        authenticationService.login(req, res);

        // then:
        expect(res.send).to.have.been.calledWith(user);
      });
    });

Using callsArgWith/yields

Sinon's callsArgWith first takes an index indicating the index of the callback in the parameter list and then the parameters that the callback will receive.
Since findById first take an id and then a callback, the callback's index is 1. And because we want to test the error case, we pass it an error object.
Using this method, we can control what our callback receives without having to execute the internal code of the userService.

Similarly, you can also use sinon's yields method that automatically takes the first callback. So instead of writing: stub.callsArgWith(1, error); you'd write stub.yields(error);


Notes:
* If you look at the tests examples, I also added the case where userService.findById() returns a user. We are passing null as the first parameter (for the error) and then the 'found' user.

* There are a whole family of functions around the ideas of callsArgWith/yields.

* I also added an example in case the function you are testing takes a callback as one of its parameters.

I hope you found this article usefull and clarified how to use SinonJS. Happy unit testing!
