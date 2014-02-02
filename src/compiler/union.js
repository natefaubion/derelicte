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
