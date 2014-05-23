// Generated by CoffeeScript 1.7.1
(function() {
  var Env;

  Env = (function() {
    function Env() {
      this.vars = {};
    }

    Env.prototype.Let = function(name, thing) {
      if (typeof thing === 'function') {
        this.vars[name] = thing;
      } else {
        this.vars[name] = function() {
          return thing;
        };
      }
      return Object.defineProperty(this, name, {
        get: this.vars[name],
        enumerable: true
      });
    };

    return Env;

  })();

  (typeof module !== "undefined" && module !== null ? module.exports.Env = Env : void 0) || (this.Env = Env);

}).call(this);
