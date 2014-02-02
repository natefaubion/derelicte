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
  // else if { ... } else ...
  rule { ($cs ...) ($bs ...) () if $cond:expr { $succ ... } else $rest ... } => {
    if_collect ($cs ... ($cond)) ($bs ... ($succ ...)) () $rest ...
  }
  // else if { ... } ; ...
  rule { ($cs ...) ($bs ...) () if $cond:expr { $succ ... } ; $rest ... } => {
    (function () {
      if_unwrap ($cs ... ($cond)) ($bs ... ($succ ...)) ()
    })() ; $rest ...
  }
  // else if { ... } ... (implicit semicolon)
  // rule { ($cs ...) ($bs ...) () if $cond:expr { $succ ... } $more $rest ... } => {
  //   (function () {
  //     if_unwrap ($cs ... ($cond)) ($bs ... ($succ ...)) ()
  //   })() ; $more $rest ...
  // }
  // else if { ... }
  rule { ($cs ...) ($bs ...) () if $cond:expr { $succ ... } } => {
    (function () {
      if_unwrap ($cs ... ($cond)) ($bs ... ($succ ...)) ()
    })()
  }
  // else { ... } ; ...
  rule { ($cs ...) ($bs ...) () { $fail ... } ; $rest ... } => {
    (function () {
      if_unwrap ($cs ...) ($bs ...) ($fail ...)
    })() ; $rest ...
  }
  // else { ... } ... (implicit semicolon)
  // rule { ($cs ...) ($bs ...) () { $fail ... } $more $rest ... } => {
  //   (function () {
  //     if_unwrap ($cs ...) ($bs ...) ($fail ...)
  //   })() ; $more $rest ...
  // }
  // else { ... }
  rule { ($cs ...) ($bs ...) () { $fail ... } } => {
    (function () {
      if_unwrap ($cs ...) ($bs ...) ($fail ...)
    })()
  }
}

let if = macro {
  // if { ... } else ...
  rule { $cond:expr { $succ ... } else $rest ... } => {
    if_collect (($cond)) (($succ ...)) () $rest ...
  }
  // if { ... } ; ...
  rule { $cond:expr { $succ ... } ; $rest ... } => {
    (function() {
      if_unwrap (($cond)) (($succ ...)) ()
    })() ; $rest ...
  }
  // if { ... } ... (implicit semicolon)
  // rule { $cond:expr { $succ ... } $more $rest ... } => {
  //   (function() {
  //     if_unwrap (($cond)) (($succ ...)) ()
  //   })() ; $more $rest ...
  // }
  // if { ... }
  rule { $cond:expr { $succ ... } } => {
    (function() {
      if_unwrap (($cond)) (($succ ...)) ()
    })()
  }
}
