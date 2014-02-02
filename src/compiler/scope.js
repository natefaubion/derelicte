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
