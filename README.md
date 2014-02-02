derelicte
=========

Derelicte is a toy altJS language implemented entirely with simple
[sweet.js](https://github.com/mozilla/sweet.js) macros. It has modules, curried
functions, unions, pattern matching, lexical scope, and no `this` confusion. It
is very inefficient, and currently lacks meaningful syntax errors.

Install
-------

You can install derelicte via npm:

    npm install -g derelicte
    drl mymodule

Hello, World!
-------------

Fire up your favorite text editor and write something like this:

```js
mod hello {
  pub def main args {
    let name = if args[0] { args[0] } else { 'world' };
    println('hello, ' + name)
  }
}
```

Save this as `hello.drl` and run it with `drl hello derek`. Eventually you may
see something printed to the screen.

You can see the JavaScript output by calling `drl --js hello.drl`.

Language Tour
-------------

### `mod`, `use`, `pub`

```js
mod foo {
  // Import bar
  use bar

  // Import bar qualified
  use bar as b

  // Import specific things
  use bar.baz { quux, quux as q }
}

mod bar {
  // Private module level value
  a = 12

  // Public module level value
  pub a = 42
}

// Namespacing
mod bar.baz {
  // Named function definition
  pub def quux x {
    x + 42
  }
}
```

When using the `drl` binary, modules will also be resolved on the file system.
`foo.bar` would be resolved to `./foo/bar/bar.drl` or `./foo/bar.drl`.

### `def`, `fn`

A named function is declared using `def`, followed by a name and argument
lists.

```js
mod fns {
  def add a b {
    a + b
  }
  res = add(1)(2)
}
```

Anonymous functions are declared using `fn`.

```js
mod fns {
  succ = fn x { x + 1 }
}
```

Functions can have multiple argument lists.

```js
mod fns {
  // Curried
  def add x y { x + y }

  // Uncurried
  def add (x, y) { x + y } 

  // Mix and match
  def nonsense a (b, c) d { a + b + c + d }
}
```

Functions can have multiple statements separated by a semicolon. It will
evaluate to its last expression. If the last expression ends with a semicolon,
it will return `null`.

```js
mod fns {
  def stmts x y {
    let a = 12;
    let b = 42;

    if x < y {
      x + a 
    } else {
      y + b
    }
  }
}
```

If you use an `if` in the middle of a function, you need to put a semicolon
after it.

```js
mod fns {
  def ifs {
    let a = 12;
    let b = 42;

    if a < b {
      foo(a)
    };

    a + b
  }
}
```

### `union`

```js
mod maybe {
  pub union Maybe {
    Nothing,
    Just(_)
  }
}
```

Constructors are currently very basic, and each slot can take any value.
Declaring a union as `pub` will export its name and constructors. Constructors
are all put into the module's scope.

### `match`

```js
mod match {
  use maybe { Nothing, Just }
  def get_or_else (x, y) {
    match x {
      Nothing => y,
      Just(a) => a
    }
  }
}
```

Only very simple pattern-matching is currently supported. It can match on
literals or bind constructor values to names.

If you leave off the argument to `match`, you'll get an anonymous function that
will match on its argument.

```js
mod match {
  use maybe { Nothing, Just }
  is_nothing = match {
    Nothing => true,
    Just(_) => false
  }
}
```

### `impl`

```js
mod maybe {
  pub union Maybe {
    Nothing,
    Just(_)
  }
  impl Maybe {
    // Static property
    of = Just

    // Method
    def get_or_else self x {
      match self {
        Nothing => x,
        Just(a) => a
      }
    }
  }
}
```

All `impl` methods must take a curried `self` argument. Methods are always
bound so you never have to worry about losing a `self` reference.

```js
mod bound {
  use maybe { Just }
  get42 = Just(42).get_or_else
  
  // 42 
  value = get42(12)
}
```

### `prelude` and `std`

The prelude and standard lib are currently very small. It just has a few
functional helpers like `map`, `filter`, etc. You can access a few node
modules like `fs` and `http` through the `__host` global.

---

### Author
Nathan Faubion (@natefaubion)

### License
MIT
