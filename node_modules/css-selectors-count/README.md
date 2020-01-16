# css-selector-count [![Build Status](https://travis-ci.org/jasonslyvia/css-selectors-count.svg)](https://travis-ci.org/jasonslyvia/css-selectors-count) [![npm version](https://badge.fury.io/js/css-selectors-count.svg)](http://badge.fury.io/js/css-selectors-count)

Count selectors in your CSS file in order to make sure it don't exceed the limitation of legacy IE browsers.

## Usage

```
var csc = require('css-selectors-count');
var fs = require('fs');

fs.readFile('style.css', {encoding: 'utf8'}, function(err, file) {
  if(err) throw err;
  console.log(csc(file)); // return a object like { rules: 1, selectors: 10}
});
```

## Scripts

```
$ npm run test
$ npm run coverage
```

## License

MIT
