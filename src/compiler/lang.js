// Module loader shim
let lang = macro {
  rule { derelicte } => {
    __mods = (function() {
      var modules = {};
      return {
        get: function(str) {
          var m = modules['$' + str];
          if (!m) {
            throw new Error('Module not found: ' + str);
          }
          return m();
        },
        set: function(str, val) {
          return modules['$' + str] = val;
        }
      }
    })();
  }
}
