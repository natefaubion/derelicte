//= util.js
//= lang.js
//= scope.js
//= fn.js
//= mod.js
//= union.js
//= match.js
//= impl.js
//= if.js

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
