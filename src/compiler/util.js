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
