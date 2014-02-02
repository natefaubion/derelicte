macro error {
  case { _ $name $err $tok } => {
    throwSyntaxError(unwrapSyntax(#{ $name }),
                     unwrapSyntax(#{ $err }),
                     #{ $tok });
  }
}
macro to_str {
  case { _ ($toks ...) } => {
    var toks = #{ $toks ... };
    var str = toks.map(unwrapSyntax).join('');
    return [makeValue(str, #{ here })];
  }
}
macro logstx {
  case { _ ($toks ...) } => {
    #{ $toks ... }.map(function(t) {
      console.log(t.token);
    });
    return [];
  }
}
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
macro expr_or_stmt {
  rule { { $e:expr ; } } => {
    ($e, null)
  }
  rule { { $e:expr } } => {
    $e
  }
  rule { {} } => {
    null
  }
}
macro scoped_collect {
  rule { ($stmts ...) () (let $lhs:ident = $rhs:expr ; $rest ...) } => {
    scoped_collect ($stmts ... (var $lhs = $rhs)) () ($rest ...)
  }
  rule { ($stmts ...) () (let $lhs:ident = $rhs:expr) } => {
    scoped_collect ($stmts ... (var $lhs = $rhs)) () ()
  }
  rule { ($stmts ...) () ($stmt:expr ; $rest ...) } => {
    scoped_collect ($stmts ... ($stmt)) () ($rest ...)
  }
  rule { ($stmts ...) () ($stmt:expr) } => {
    scoped_collect ($stmts ...) ($stmt) ()
  }
  rule { () ($last ...) () } => {
    return expr_or_stmt { $last ... };
  }
  rule { (($stmts ...) ...) ($last ...) () } => {
    $($stmts ... ;) ...
    return expr_or_stmt { $last ... };
  }
}
macro scoped {
  rule infix { return | { $rest ... } } => {
    return (function() {
      scoped_collect () () ($rest ...)
    })()
  }
  rule { { $rest ... } } => {
    scoped_collect () () ($rest ...)
  }
}
macro fn_curry {
  rule { () { $body ... } } => {
    scoped { $body ... }
  }
  rule { (($args (,) ...) $next $rest ...) $body } => {
    function($args (,) ...) {
      return fn_curry ($next $rest ...) $body
    }
  }
  rule { ($arg:ident $next $rest ...) $body } => {
    function($arg) {
      return fn_curry ($next $rest ...) $body
    }
  }
  rule { (($args (,) ...)) $body } => {
    function($args (,) ...) {
      fn_curry () $body
    }
  }
  rule { ($arg:ident) $body } => {
    function($arg) {
      fn_curry () $body
    }
  }
}
let fn = macro {
  rule { { $body ... } } => {
    function() {
      fn_curry () { $body ... }
    }
  }
  rule { $args ... { $body ... } } => {
    fn_curry ($args ...) { $body ... }
  }
}
macro named_fn {
  rule { $name ($func:expr) } => {
    named_fn $name [$func]
  }
  rule { $name [function $args $body] } => {
    function $name $args $body
  }
}
let def = macro {
  rule { $name:ident $args ... { $body ... } } => {
    named_fn $name (fn $args ... { $body ... })
  }
}
macro mod_unwrap_ns {
  rule { ($name:ident) () } => {
    var $name = __mods.get(to_str($name));
  }
  rule { ($name:ident . $rest ...) () } => {
    var m = __mods.get(to_str($name . $rest ...));
    var $name = $name || {};
    mod_unwrap_ns m ($rest ...) ($name)
  }
  rule { $m ($name:ident . $rest ...) ($prev ...) } => {
    if (typeof $prev (.) ... . $name === 'undefined') {
      $prev (.) ... . $name = {};
    }
    mod_unwrap_ns $m ($rest ...) ($prev ... $name)
  }
  rule { $m ($name:ident) ($prev ...) } => {
    if (typeof $prev (.) ... . $name === 'undefined') {
      $prev (.) ... . $name = {};
    }
    for (var k in $m) {
      if ($m.hasOwnProperty(k)) {
        $prev (.) ... . $name[k] = $m[k];
      }
    }
  }
}
macro mod_name {
  rule { $pubn ($names ...) ($name:ident .) } => {
    error 'mod' 'invalid name' $name
  }
  rule { $pubn ($names ...) ($name:ident . $rest ...) } => {
    mod_name $pubn ($names ... $name) ($rest ...)
  }
  rule { $pubn ($names ...) ($name:ident) } => {
    mod_name $pubn ($names ... $name) ()
  }
  rule { $pubn (prelude) () { $body ... } } => {
    __mods.set('prelude', function(load) {
      var l = false;
      var pubs = this;
      return function() {
        if (l) return pubs;
        return l = true, load(pubs), pubs;
      };
    }(function($pubn) {
      $body ...
    }));
  }
  rule { $pubn ($names ...) () { $body ... } } => {
    __mods.set(to_str($names (.) ...), function(load) {
      var l = false;
      var pubs = {};
      return function() {
        if (l) return pubs;
        return l = true, load(pubs), pubs;
      };
    }(function($pubn) {
      $body ...
    }));
  }
}
macro mod_imports {
  rule { $m ($import:ident as $alias:ident , $rest ...) } => {
    var $alias = $m[to_str($import)];
    mod_imports $m ($rest ...)
  }
  rule { $m ($import:ident , $rest ...) } => {
    var $import = $m[to_str($import)];
    mod_imports $m ($rest ...)
  }
  rule { $m ($import:ident as $alias:ident) } => {
    var $alias = $m[to_str($import)];
  }
  rule { $m ($import:ident) } => {
    var $import = $m[to_str($import)];
  }
  rule { $m () } => {}
}
macro mod_collect {
  rule { $mod () } => {
  }
  rule { $mod (use $that:expr { $imports ... } $rest ...) } => {
    var m = __mods.get(to_str($that));
    mod_imports m ($imports ...)
    mod_collect $mod ($rest ...)
  }
  rule { $mod (use $that:expr as $name:ident $rest ...) } => {
    var $name = __mods.get(to_str($that));
    mod_collect $mod ($rest ...)
  }
  rule { $mod (use $that:expr $rest ...) } => {
    mod_unwrap_ns ($that) ()
    mod_collect $mod ($rest ...)
  }
  rule { $mod (pub def $name:ident $args ... { $body ... } $rest ...) } => {
    def $name $args ... { $body ... }
    $mod[to_str($name)] = $name;
    mod_collect $mod ($rest ...)
  }
  rule { $mod (pub union $name:ident { $body ... } $rest ...) } => {
    union $mod $name { $body ... }
    $mod[to_str($name)] = $name;
    mod_collect $mod ($rest ...)
  }
  rule { $mod (pub $name:ident = $val:expr $rest ...) } => {
    var $name = $val;
    $mod[to_str($name)] = $name;
    mod_collect $mod ($rest ...)
  }
  rule { $mod (pub $name:ident $rest ...) } => {
    $mod[to_str($name)] = $name;
    mod_collect $mod ($rest ...)
  }
  rule { $mod (def $name:ident $args ... { $body ... } $rest ...) } => {
    def $name $args ... { $body ... }
    mod_collect $mod ($rest ...)
  }
  rule { $mod (union $name:ident { $body ... } $rest ...) } => {
    union $name { $body ... }
    mod_collect $mod ($rest ...)
  }
  rule { $mod (impl $name ... { $body ... } $rest ... ) } => {
    impl $name ... { $body ...  }
    mod_collect $mod ($rest ...)
  }
  rule { $mod ($name:ident = $val:expr $rest ...) } => {
    var $name = $val;
    mod_collect $mod ($rest ...)
  }
  rule { _  ($tok $rest ...) } => {
    error 'mod' 'Unkown definition form' $tok
  }
}
macro mod {
  rule { $name ... { $body ... } } => {
    mod_name pub () ($name ...) {
      mod_collect pub ($body ...)
    }
  }
}
let run = macro {
  rule { $mod:expr $args:expr ... } => {
    require('derelicte/std');
    var prel = __mods.get('prelude');
    var main = __mods.get(to_str($mod));
    main.main([$args (,) ...]);
  }
  rule { $mod:expr } => {
    require('derelicte/std');
    var prel = __mods.get('prelude');
    var main = __mods.get(to_str($mod));
    main.main([]);
  }
}
macro union_ctr {
  case { _ $u $name ($args ...) } => {
    var argn = #{ $args ... }.map(function(a, i) {
      return makeIdent('_' + i, #{ here });
    });
    var argp = #{ $args ... }.map(function(a, i) {
      return makeValue(i, #{ here });
    });
    letstx $argn ... = argn,
           $argp ... = argp;
    return #{
      function $name($argn (,) ...) {
        if (!(this instanceof $name)) {
          return new $name($argn (,) ...);
        }
        $(this[$argp] = $argn;) ...
        this.__bound = {};
      }
      $name.prototype = new $u();
      $name.prototype.constructor = $name;
      $u.$name = $name;
    }
  }
  case { _ $u $name } => {
    return #{
      function $name(){
        this.__bound = {};
      }
      $name.prototype = new $u();
      $name.prototype.constructor = $name;
      $u.$name = new $name();
      $u.$name.prototype = $name.prototype;
    }
  }
}
macro union_ctrs {
  rule { $u ($name:ident($args:ident (,) ...) $rest ...) } => {
    union_ctr $u $name ($args ...)
    union_ctrs $u ($rest ...)
  }
  rule { $u ($name:ident $rest ...) } => {
    union_ctr $u $name
    union_ctrs $u ($rest ...)
  }
  rule { $u () } => {}
}
macro union_unwrap {
  rule { () $u ($name:ident($args ...) $rest ...) } => {
    var $name = $u.$name;
    union_unwrap () $u ($rest ...)
  }
  rule { () $u ($name:ident $rest ...) } => {
    var $name = $u.$name;
    union_unwrap () $u ($rest ...)
  }
  rule { $m $u ($name:ident($args ...) $rest ...) } => {
    var $name = $u.$name;
    $m[to_str($name)] = $name;
    union_unwrap $m $u ($rest ...)
  }
  rule { $m $u ($name:ident $rest ...) } => {
    var $name = $u.$name;
    $m[to_str($name)] = $name;
    union_unwrap $m $u ($rest ...)
  }
  rule { _ _ () } => {}
}
macro union {
  rule { $mod:ident $name:ident { $ctrs:expr (,) ... } } => {
    var $name = function() {
      function $name(){}
      union_ctrs $name ($ctrs ...)
      return $name;
    }();
    union_unwrap $mod $name ($ctrs ...)
  }
  rule { $name:ident { $ctrs:expr (,) ... } } => {
    var $name = function() {
      function $name(){}
      union_ctrs $name ($ctrs ...)
      return $name;
    }();
    union_unwrap () $name ($ctrs ...)
  }
}
macro match_case {
  case { _ $that ($val:lit) ($body ...) } => {
    return #{
      if ($that === $val) {
        return scoped {
          $body ...
        }
      }
    }
  }
  case { _ $that ($name ... ($args:ident (,) ...)) ($body ...) } => {
    var here = #{ here };
    var res = [];
    #{ $args ... }.forEach(function(a, i) {
      res = res.concat(
        makeKeyword('let', here), a, makePunc('=', here), 
        #{ $that }, makeDelim('[]', [
          makeValue(i, here)
        ], here),
        makePunc(';', here));
    });
    return withSyntax ($destruct ... = res) {
      return #{
        if ($that.constructor === $name ... .prototype.constructor) {
          return scoped {
            $destruct ...
            $body ...
          }
        }
      }
    }
  }
  case { _ $that ($name ...) ($body ...) } => {
    var name = #{ $name ... };
    if (name.length === 1 && unwrapSyntax(name) === '_') {
      return #{
        if (true) {
          return scoped {
            $body ...
          }
        }
      }
    } else {
      return #{
        if ($that.constructor === $name ... .prototype.constructor) {
          return scoped {
            $body ...
          }
        }
      }
    }
  }
}
macro match_cases {
  rule { $that ($lhs:ident => { $body ... } ,... $rest ...) } => {
    match_case $that ($lhs) ($body ...)
    match_cases $that ($rest ...)
  }
  rule { $that ($lhs:expr => { $body ... } ,... $rest ...) } => {
    match_case $that ($lhs) ($body ...)
    match_cases $that ($rest ...)
  }
  rule { $that ($lhs:ident => $rhs:expr , $rest ...) } => {
    match_case $that ($lhs) ($rhs)
    match_cases $that ($rest ...)
  }
  rule { $that ($lhs:expr => $rhs:expr , $rest ...) } => {
    match_case $that ($lhs) ($rhs)
    match_cases $that ($rest ...)
  }
  rule { $that ($lhs:ident => $rhs:expr) } => {
    match_case $that ($lhs) ($rhs)
  }
  rule { $that ($lhs:expr => $rhs:expr) } => {
    match_case $that ($lhs) ($rhs)
  }
  rule { $that () } => {}
}
let match = macro {
  rule { $that:expr { $cases ... } } => {
    function(that) {
      match_cases that ($cases ...)
      throw new TypeError('No match')
    }($that)
  }
  rule { { $cases ... } } => {
    function(that) {
      match_cases that ($cases ...)
      throw new TypeError('No match')
    }
  }
  rule {} => {
    match
  }
}
macro impl_getter {
  rule { ($i ...) $name $fn:expr } => {
    Object.defineProperty($i ... .prototype, to_str($name), {
      configurable: true,
      get: function() {
        return this.__bound[to_str('$' $name)]
            || (this.__bound[to_str('$' $name)] = $fn(this));
      }
    })
  }
}
macro impl_collect {
  rule { $i (def $name:ident $self:ident { $body ... } $rest ...) } => {
    impl_getter $i $name fn $self () { $body ... }
    impl_collect $i ($rest ...)
  }
  rule { $i (def $name:ident ($self:ident) { $body ... } $rest ...) } => {
    impl_getter $i $name fn $self () { $body ... }
    impl_collect $i ($rest ...)
  }
  rule { $i (def $name:ident $self:ident $args ... { $body ... } $rest ...) } => {
    impl_getter $i $name fn $self $args ... { $body ... }
    impl_collect $i ($rest ...)
  }
  rule { ($i ...) ($name:ident = $body:expr $rest ...) } => {
    $i ... .$name = $body;
    impl_collect ($i ...) ($rest ...)
  }
  rule { $name () } => {}
}
macro impl {
  rule { $name:expr { $body ... } } => {
    impl_collect ($name) ($body ...)
  }
}
macro if_unwrap {
  rule { (($cond ...)) (($branch ...)) () } => {
    if ($cond ...) {
      return scoped {
        $branch ...
      }
    } else {
      return null;
    }
  }
  rule { (($cond ...)) (($branch ...)) ($fail ...) } => {
    if ($cond ...) {
      return scoped {
        $branch ...
      }
    } else {
      return scoped {
        $fail ...
      }
    }
  }
  rule { (($cond ...) $cs ...) (($branch ...) $bs ...) $else } => {
    if ($cond ...) {
      return scoped {
        $branch ...
      }
    } else {
      if_unwrap ($cs ...) ($bs ...) $else
    }
  }
}
macro if_collect {
  rule { ($cs ...) ($bs ...) () if $cond:expr { $succ ... } else $rest ... } => {
    if_collect ($cs ... ($cond)) ($bs ... ($succ ...)) () $rest ...
  }
  rule { ($cs ...) ($bs ...) () if $cond:expr { $succ ... } ; $rest ... } => {
    (function () {
      if_unwrap ($cs ... ($cond)) ($bs ... ($succ ...)) ()
    })() ; $rest ...
  }
  rule { ($cs ...) ($bs ...) () if $cond:expr { $succ ... } } => {
    (function () {
      if_unwrap ($cs ... ($cond)) ($bs ... ($succ ...)) ()
    })()
  }
  rule { ($cs ...) ($bs ...) () { $fail ... } ; $rest ... } => {
    (function () {
      if_unwrap ($cs ...) ($bs ...) ($fail ...)
    })() ; $rest ...
  }
  rule { ($cs ...) ($bs ...) () { $fail ... } } => {
    (function () {
      if_unwrap ($cs ...) ($bs ...) ($fail ...)
    })()
  }
}
let if = macro {
  rule { $cond:expr { $succ ... } else $rest ... } => {
    if_collect (($cond)) (($succ ...)) () $rest ...
  }
  rule { $cond:expr { $succ ... } ; $rest ... } => {
    (function() {
      if_unwrap (($cond)) (($succ ...)) ()
    })() ; $rest ...
  }
  rule { $cond:expr { $succ ... } } => {
    (function() {
      if_unwrap (($cond)) (($succ ...)) ()
    })()
  }
}

// let := = macro {
//   rule infix { $lhs:expr | $rhs:expr } => {
//     $lhs:expr = $rhs:expr
//   }
// }

// let == = {
//   rule {} => { === }
// }

// let != = {
//   rule {} => { !== }
// }

export fn;
export mod;
export run;
export if;
export match;
// export ==;
// export !=;
// export :=;

// Restrictions
// ------------

let while = macro {
  case { $name } => { throwSyntaxError('while', 'Not supported', #{ $name }) }
}

let for = macro {
  case { $name } => { throwSyntaxError('for', 'Not supported', #{ $name }) }
}

let do = macro {
  case { $name } => { throwSyntaxError('do', 'Not supported', #{ $name }) }
}

let function = macro {
  case { $name } => { throwSyntaxError('function', 'Not supported', #{ $name }) }
}

let this = macro {
  case { $name } => { throwSyntaxError('this', 'Not supported', #{ $name }) }
}

let var = macro {
  case { $name } => { throwSyntaxError('var', 'Not supported', #{ $name }) }
}

let const = macro {
  case { $name } => { throwSyntaxError('const', 'Not supported', #{ $name }) }
}

// let = = {
//   case { $name } => { throwSyntaxError('=', 'Not supported, use :=', #{ $name }) }
// }

let let = macro {
  case { $name } => { throwSyntaxError('let', 'Not supported', #{ $name }) }
}

export while;
export for;
export do;
export function;
export this;
export var;
export const;
export let;
