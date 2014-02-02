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
