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
