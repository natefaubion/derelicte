__mods.set('console', function (load) {
    var l = false;
    var pubs = {};
    return function () {
        if (l)
            return pubs;
        return l = true, load(pubs), pubs;
    };
}(function (pub) {
    var console = __host.console;
    var log = console.log.bind(console);
    pub['log'] = log;
    var err = console.error.bind(console);
    pub['err'] = err;
}));
__mods.set('prelude', function (load) {
    var l = false;
    var pubs = this;
    return function () {
        if (l)
            return pubs;
        return l = true, load(pubs), pubs;
    };
}(function (pub) {
    function id(x) {
        return x;
    }
    pub['id'] = id;
    function always(x) {
        return function (y) {
            return x;
        };
    }
    pub['always'] = always;
    function flip(f) {
        return function (x, y) {
            return f(y, x);
        };
    }
    pub['flip'] = flip;
    function arity1(f) {
        return function (a) {
            return f(a);
        };
    }
    pub['arity1'] = arity1;
    function arity2(f) {
        return function (a, b) {
            return f(a, b);
        };
    }
    pub['arity2'] = arity2;
    function arity3(f) {
        return function (a, b, c) {
            return f(a, b, c);
        };
    }
    pub['arity3'] = arity3;
    function curry(f) {
        return function (a) {
            return function (b) {
                return f(a, b);
            };
        };
    }
    pub['curry'] = curry;
    function curry3(f) {
        return function (a) {
            return function (b) {
                return function (c) {
                    return f(a, b, c);
                };
            };
        };
    }
    pub['curry3'] = curry3;
    function curry4(f) {
        return function (a) {
            return function (b) {
                return function (c) {
                    return function (d) {
                        return f(a, b, c, d);
                    };
                };
            };
        };
    }
    pub['curry4'] = curry4;
    function uncurry(f) {
        return function (a, b) {
            return f(a)(b);
        };
    }
    pub['uncurry'] = uncurry;
    function uncurry3(f) {
        return function (a, b, c) {
            return f(a)(b)(c);
        };
    }
    pub['uncurry3'] = uncurry3;
    function uncurry4(f) {
        return function (a, b, c, d) {
            return f(a)(b)(c)(d);
        };
    }
    pub['uncurry4'] = uncurry4;
    function get(k) {
        return function (o) {
            return o[k];
        };
    }
    pub['get'] = get;
    function map(f) {
        return function (xs) {
            return xs.map(arity1(f));
        };
    }
    pub['map'] = map;
    function filter(f) {
        return function (xs) {
            return xs.filter(arity1(f));
        };
    }
    pub['filter'] = filter;
    function reduce(f) {
        return function (xs) {
            return function (acc) {
                return xs.reduce(arity2(f), acc);
            };
        };
    }
    pub['reduce'] = reduce;
    function reduceRight(f) {
        return function (xs) {
            return function (acc) {
                return xs.reduceRight(arity2(f), acc);
            };
        };
    }
    pub['reduceRight'] = reduceRight;
    var fold = reduce;
    pub['fold'] = fold;
    var foldr = reduceRight;
    pub['foldr'] = foldr;
    var console = __mods.get('console');
    var println = console.log;
    pub['println'] = println;
}));