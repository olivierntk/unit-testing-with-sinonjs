Sinon.JS is a standalone unit testing library for JavaScript. It provides spies, stubs and mocks. We used it extensively while building our services in Node.js but it also supports objects to test your client side code. We found it very useful and easy to use, but its API was not easy to understand at first. In this post, I want to share the lessons learned from using Sinon's spies and stubs.

Notes:
In this post, we are using mocha (http://mochajs.org/) as the test runner and chaijs (http://chaijs.com/) to express our tests assertions. Sinon has its own assertion API. We are using the sinon-chai module (https://github.com/domenic/sinon-chai) to bridge Sinon' assertions with chaijs' assertions.

The sample code can be found at: https://github.com/olivierntk/unit-testing-with-sinonjs

1. Spies
====================

###### From SinonJS's docs:

>"A test spy is a function that records arguments, return value, the value of this and exception thrown (if any) for all its calls. A test spy can be an anonymous function or it can wrap an existing function."


1.1 Using spies as an anonymous function: sinon.spy()
---------------------

Let's consider moduleA (under /lib/moduleA.js) and see how we would test it.
In moduleA, the function ```greet()``` takes a name and a logger object that has a ```log()``` method.
The unit test should verify that the result string is correct and that the logger's log method was called with the correct parameter.
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

        // Reset the spy so that this test does not affect other tests.
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

The point to note is that the spy lets the code execute so you will see the log function execute and the message in your console.
The test itself doesn't change except that we are using restore in this scenario.

2. Stubs
====================

###### From the docs:
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

Here, we used the ability of a stub to have a pre-programmed behavior (using ```.returns()```) so we can control the dependency and since a stub does not let the original function execute, we can properly isolate moduleB's function.

2.2 Testing asynchronous code
---------------------

When programmers start with Node.js, dealing with asynchronous programming can be confusing and unit testing asynchronous code can be even more so. But once you get a grasp of sinon's api, it can be quite easy.

Let's look at [authentication\_service.js](https://github.com/olivierntk/unit-testing-with-sinonjs/blob/master/lib/authentication\_service.js). It has a login method which internally uses the asynchronous userService.findById method. findById() takes an id as its first parameter and a function to execute once it receives the data from the userService. The file /test/stub/authentication_service.js shows how we can test it.

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
        stub.callsArgWithAsync(1, error);

        // when:
        authenticationService.login(req, res);

        // then:
        process.nextTick(function () {
          expect(res.send).to.have.been.calledWith(error.message);
          done();
        });
      });

      it('should return the user if the authentication succeeds', function () {
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

There are quite a few points to talk about in the code above, so let's go slowly.

#### beforeEach/afterEach
First, note the use of mocha's hooks (beforeEach/afterEach) to create a res.send spy and userService.findById stub before each tests and reset/restore the spy/stub after each tests.
It is important to reset/restore spies and stubs for subsequent tests and mocha's hooks are a convenient place to do this.

#### callsArg, callsArgWith, yields, callsArgWithAsync, yieldsAsync etc ...
SinonJS has a whole set of APIs around callsArg/yields and their asynchronous versions. Let's take a moment to look at the concepts and you will be able to understand most of Sinon's stub APIs

###### From the docs:
>"stub.callsArg(index): Causes the stub to call the argument at the provided index as a callback function. stub.callsArg(0); causes the stub to call the first argument as a callback."

```callsArg()``` allows us to execute the callback passed to the stub by passing the index of the callback in the list of parameters received by the stub. This callback in our case holds the logic we're trying to test.
```callsArgWith()``` takes the callback index and the arguments that should be passed to the callback. ```yield``` is the same as callsArgWith except we don't pass the callback index, as yield just picks up the first callback it finds.

callsArgWith/yields have an asynchronous counterpart: callsArgWithAsync/yieldsAsync. The difference in the async versions is how the callback gets executed. In our case, the callback is executed asynchronously (by the userService) so we use callsArgWithAsync.

Since ```userService.findById()``` first takes an id and then a callback, the callback's index is 1. And because we want to test the error case, we pass it an error object. Hence: ```stub.callsArgWithAsync(1, error);```. Using this method, we can control what our callback receives without having to execute the internal code of the userService. If you want to use yields, then you'd write ```stub.yieldsAsync(error);```.

#### process.nextTick()
After setting up our fixtures and stub, we execute the method under test. The method under test puts our callback with our logic and spies on the event loop.
If we were to do the expectation synchronously, as in:

    it('should return an error message if the authentication fails', function (done) {
      // setup:
      var error = new Error('Authentication failed.');
      stub.callsArgWithAsync(1, error);

      // when:
      authenticationService.login(req, res);

      // then:
      expect(res.send).to.have.been.calledWith(error.message);
      done();
    });

Our tests would fail because we'd check on the spy before it is called in the userService.findById() callback.
To make sure the expectation executed after the spies were called, we put the expectation in a function that we run on the event loop after the callback using ```process.nextTick()```;
We then call ```done()``` to tell mocha that our test completed.

Notes:
* If you look at the tests examples, I also added the case where userService.findById() returns a user. We are passing null as the first parameter (for the error) and then the 'found' user.
* I also added an example in case the function you are testing takes a callback as one of its parameters.

Summary
====================
I hope you found this article usefull and clarified how to use SinonJS. There are quite a few concepts in this post and it took us some time to understand Sinon's API and how to use it properly. Please comment back with questions or your own lessons learned. Happy unit testing!
