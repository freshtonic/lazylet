

# NOTE!

LazyLet has been renamed to Given and now lives here [github.com/freshtonic/given.js](http://github.com/freshtonic/given.js).

# lazylet

*lazylet* is a lazy-evaluation system for use in your specs.

Variables are defined within an environment object and are lazily computed on
demand. A variable can hold either a value, function or object. If the variable
is a function it used for computing the value of the variable when it is
accessed from the environment.

Variables are accessed from the environment as if they are plain JS properties.
Under the hood, the properties are defined using Object.defineProperty with
a 'get' accessor in order that their value can be computed on demand.

_WARNING_: LazyLet is not yet stable. The API may change significantly before
1.0.0 and there may be show-stopping bugs.

## Installation

Add it to your package.json or `npm install lazylet`.

## Usage

### Javascript

```js

  LazyLet = require('../build/lazylet');

  expect = require('expect.js');

  describe("LazyLet", function() {
    var Let, env;
    Let = env = undefined;
    beforeEach(function() {
      env = LazyLet.Env();
      Let = env.Let;
    });

    it("can define a variable", function() {
      Let('name', 'James Sadler');
      expect(env.name).to.equal("James Sadler");
    });

    it("can define a variable that is depends on another and is computed on demand", function() {
      Let('name', 'James Sadler');
      Let('message', function() {
        return "Hello, " + this.name + "!";
      });

      expect(env.message).to.equal('Hello, James Sadler!');
    });

    it('can define variables in bulk', function() {
      Let({
        name: 'James Sadler',
        age: 36
      });

      expect(env.name).to.equal('James Sadler');
      expect(env.age).to.equal(36);
    });

    it('provides a way to explicitly clear the environment', function() {
      Let('name', 'James Sadler');
      Let.clear();
      expect(typeof env.name).to.be('undefined');
    });

    it('can define variable in terms of the existing value', function() {
      Let('array', function() {
        return [1];
      });

      Let('array', function() {
        return this.array.concat(2);
      });

      Let('array', function() {
        return this.array.concat(3);
      });

      expect(env.array).to.eql([1, 2, 3]);
    });

    it('supports the definition of variables that depend on a variable that is not yet defined', function() {
      Let({
        foo: function() {
          return this.bar;
        }
      });

      Let({
        bar: function() {
          return 'Bar';
        }
      });

      expect(env.foo).to.equal('Bar');
    });

    it('supports the redefinition of', function() {
      Let({
        name1: function() {
          return "James";
        }
      });

      Let({
        message: function() {
          return "" + this.name1 + " and " + this.name2;
        }
      });

      Let({
        name2: function() {
          return "Kellie";
        }
      });

      expect(env.message).to.equal('James and Kellie');
    });

    it('memoizes variables when they are evaluated', function() {
      var count;
      count = 0;
      Let({
        name: function() {
          count += 1;
          return 'James';
        }
      });

      env.name;
      expect(count).to.equal(1);
      env.name;
      expect(count).to.equal(1);
    });

    it('uses memoized variables when variables are defined in terms of others', function() {
      var count;
      count = 0;
      Let({
        val1: function() {
          count += 1;
          return count;
        }
      });

      Let({
        val2: function() {
          return this.val1;
        }
      });

      expect(env.val1).to.equal(1);
      expect(env.val2).to.equal(1);
    });

    it('uses memoized variables when variables are defined in terms of their previous values', function() {
      var count1, count2;
      count1 = 0;
      Let({
        val1: function() {
          count1 += 1;
          return 1;
        }
      });

      count2 = 0;
      Let({
        val1: function() {
          count2 += 1;
          return this.val1 + 1;
        }
      });

      expect(env.val1).to.equal(2);
      expect(count1).to.equal(1);
      expect(count2).to.equal(1);
    });

    it('forgets the memoization for all variables when any variable is redefined', function() {
      var count;
      count = 0;
      Let({
        name: function() {
          count += 1;
          return 'James';
        }
      });

      expect(env.name).to.equal('James');
      expect(count).to.equal(1);
      Let({
        age: function() {
          return 36;
        }
      });

      expect(env.name).to.equal('James');
      expect(count).to.equal(2);
    });

    it('exposes all defined properties as enumerable', function() {
      Let({
        name: function() {
          return 'James';
        }
      });

      Let({
        age: function() {
          return 36;
        }
      });

      Let({
        occupation: function() {
          return 'programmer';
        }
      });

      expect(JSON.parse(JSON.stringify(env))).to.eql({
        name: 'James',
        age: 36,
        occupation: 'programmer'
      });

    });

    describe('is well-behaved and', function() {
      it('does not allow redefinition of "Let"', function() {
        expect(function() {
          Let('Let', 'anything');
        }).to.throwException(function(e) {
          expect(e.message).to.equal('cannot redefine Let');
        });

      });

      it('gives a meaningful error when recursive definitions blow the stack', function() {
        Let({
          a: function() {
            return this.b;
          }
        });

        Let({
          b: function() {
            return this.a;
          }
        });

        expect(function() {
          return env.a;
        }).to.throwException(function(e) {
          expect(e.message).to.match(/recursive definition of variable '(a|b)' detected/);
        });

      });

      it('prevents the Let environment from being referenced within a builder function', function() {
        Let({
          foo: function() {
            return 'foo';
          }
        });

        Let({
          viaThis: function() {
            return this.foo;
          }
        });

        Let({
          viaEnv: function() {
            return env.foo;
          }
        });

        expect(env.viaThis).to.eql('foo');
        expect(function() {
          return env.viaEnv;
        }).to.throwException(function(e) {
          expect(e.message).to.equal("illegal attempt to access the Let environment in the definition of 'viaEnv'");
        });

      });

    });

```

### Coffee

```coffee

LazyLet = require '../build/lazylet'
expect = require 'expect.js'

describe "LazyLet", ->

  Let = env = undefined

  beforeEach ->
    env = LazyLet.Env()
    Let = env.Let

  it "can define a variable", ->
    Let 'name', 'James Sadler'
    expect(env.name).to.equal "James Sadler"

  it "can define a variable that is depends on another and is computed on demand", ->
    Let 'name', 'James Sadler'
    Let 'message', -> "Hello, #{@name}!"
    expect(env.message).to.equal 'Hello, James Sadler!'

  it 'can define variables in bulk', ->
    Let
      name: 'James Sadler'
      age: 36
    expect(env.name).to.equal 'James Sadler'
    expect(env.age).to.equal 36

  it 'provides a way to explicitly clear the environment', ->
    Let 'name', 'James Sadler'
    Let.clear()
    expect(typeof env.name).to.be 'undefined'

  it 'can define variable in terms of the existing value', ->
    Let 'array', -> [1]
    Let 'array', -> @array.concat 2
    Let 'array', -> @array.concat 3
    expect(env.array).to.eql [1, 2, 3]

  it 'supports the definition of variables that depend on a variable that is not yet defined', ->
    Let foo: -> @bar
    Let bar: -> 'Bar'
    expect(env.foo).to.equal 'Bar'

  # TODO better decscription please
  it 'supports the redefinition of', ->
    Let name1: -> "James"
    Let message: -> "#{@name1} and #{@name2}"
    Let name2: -> "Kellie"
    expect(env.message).to.equal 'James and Kellie'

  it 'memoizes variables when they are evaluated', ->
    count = 0
    Let name: ->
      count += 1
      'James'
    env.name
    expect(count).to.equal 1
    env.name
    expect(count).to.equal 1

  it 'uses memoized variables when variables are defined in terms of others', ->
    count = 0
    Let val1: ->
      count += 1
      count
    Let val2: ->
      @val1

    expect(env.val1).to.equal 1
    expect(env.val2).to.equal 1

  it 'uses memoized variables when variables are defined in terms of their previous values', ->
    count1 = 0
    Let val1: ->
      count1 += 1
      1
    count2 = 0
    Let val1: ->
      count2 += 1
      @val1 + 1

    expect(env.val1).to.equal 2
    expect(count1).to.equal 1
    expect(count2).to.equal 1

  it 'forgets the memoization for all variables when any variable is redefined', ->
    count = 0
    Let name: ->
      count += 1
      'James'
    expect(env.name).to.equal 'James'
    expect(count).to.equal 1
    Let age: -> 36
    expect(env.name).to.equal 'James'
    expect(count).to.equal 2

  it 'exposes all defined properties as enumerable', ->
    Let name: -> 'James'
    Let age: -> 36
    Let occupation: -> 'programmer'
    expect(JSON.parse JSON.stringify env).to.eql
      name: 'James'
      age: 36
      occupation: 'programmer'

  describe 'is well-behaved and', ->

    it 'does not allow redefinition of "Let"', ->
      expect(-> Let 'Let', 'anything').to.throwException (e) ->
        expect(e.message).to.equal 'cannot redefine Let'

    it 'gives a meaningful error when recursive definitions blow the stack', ->
      Let a: -> @b
      Let b: -> @a
      expect(-> env.a).to.throwException (e) ->
        expect(e.message).to.match /recursive definition of variable '(a|b)' detected/

    it 'prevents the Let environment from being referenced within a builder function', ->
      Let foo: -> 'foo'
      Let viaThis: -> @foo
      Let viaEnv: -> env.foo
      expect(env.viaThis).to.eql 'foo'
      expect(-> env.viaEnv).to.throwException (e) ->
        expect(e.message).to.equal "illegal attempt to access the Let environment in the definition of 'viaEnv'"

```

## Caveats

To set a variable with a value that *is* a function, nest it within
another function (to avoid ambiguity with dynamically computing a value), like so:

```javascript

env.Let('aFunction', function() {
    // This function will be the variable's value.
    return function() {
        return 'foo';
    };
});

```

## Running the specs

Run `make spec`.

Install the `wach` node module if you would like to have the specs run
automatically when the source or specs are modified.

- `npm install -g wach`
- `make watch`

## Contributing

1. Fork it ( https://github.com/freshtonic/lazylet/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Licence

Copyright (c) 2014, lazylet is developed and maintained by James Sadler, and is
released under the open MIT Licence.

