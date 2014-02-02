var fs = require('fs');
var sweet = require('sweet.js');
var resolve = require('resolve');
var macrosLoc = resolve.sync('./macros/index.js', { basedir: __dirname });
var macros = sweet.loadModule(fs.readFileSync(macrosLoc, 'utf8'));

exports.compile = function(src) {
  return sweet.compile(src, {
    modules: [macros],
    readableNames: true,
    escodegen: {
      format: {
        indent: {
          style: '  '
        }
      }
    }
  }).code;
};
