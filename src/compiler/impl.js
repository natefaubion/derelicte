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
