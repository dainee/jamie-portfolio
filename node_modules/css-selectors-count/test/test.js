var csc = require('../');
var fs = require('fs');
var expect = require('chai').expect;

describe('css-selectors-count', function(){
  it('should not throw for empty file', function() {
    var result = csc('');
    expect(result.selectors).to.equal(0);
    expect(result.rules).to.equal(0);
  });

  it('should parse selectors correctly', function(done) {
    fs.readFile('./test/fixtures/normal.css', {encoding: 'utf8'}, function(err, file){
      if(err) {
        throw err;
      }

      var result = csc(file);
      expect(result.selectors).to.equal(1);
      expect(result.rules).to.equal(1);

      done();
    });
  });

  it('should parse selectors with media query correctly', function(done) {
    fs.readFile('./test/fixtures/normal-with-media.css', {encoding: 'utf8'}, function(err, file){
      if(err) {
        throw err;
      }

      var result = csc(file);
      expect(result.selectors).to.equal(2);
      expect(result.rules).to.equal(2);

      done();
    });
  });
});
