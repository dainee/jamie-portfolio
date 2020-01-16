var css = require('css');

module.exports = exports = function(source) {
  var result = parseCSS(source);

  return {
    rules: result.rules,
    selectors: result.selectors
  };
}

function parseCSS(source) {
  var ast = css.parse(source);
  var result = {};

  if (ast && ast.stylesheet && ast.stylesheet.parsingErrors.length === 0) {
    result.rules = ast.stylesheet.rules.length;
    result.selectors = countSelectors(ast.stylesheet.rules);
  }

  return result;
}

function countSelectors(rules) {
  return rules.reduce(function(prev, curr) {
    switch(curr.type) {
      case 'rule': {
        return prev + curr.selectors.length;
      }

      case 'media': {
        return prev + countSelectors(curr.rules);
      }

      default: {
        return prev;
      }
    }
  }, 0);
}
