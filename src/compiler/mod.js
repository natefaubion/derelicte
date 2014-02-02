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
