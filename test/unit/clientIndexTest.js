var expect          = require('chai').expect;
var SwDelta         = require('../../clientside/index.js');

describe('Client Index', function() {
  
    describe('the "splitVersion" function', function() {

        var swDelta = new SwDelta();

        it('parses an alphanumeric version', function() {
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-123.js')).to.deep.equal({unversionned: 'https://domain.com/path/file.js', version: '123'});
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-0.js')).to.deep.equal({unversionned: 'https://domain.com/path/file.js', version: '0'});
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-abc.js')).to.deep.equal({unversionned: 'https://domain.com/path/file.js', version: 'abc'});
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-a1b2c3.js')).to.deep.equal({unversionned: 'https://domain.com/path/file.js', version: 'a1b2c3'});
            expect(swDelta.splitVersionFromUrl('https://domain.com/some-path/file-123.js')).to.deep.equal({unversionned: 'https://domain.com/some-path/file.js', version: '123'});
        });

        it('parses a dotted or splitted version', function() {
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-1.2.3.js')).to.deep.equal({unversionned: 'https://domain.com/path/file.js', version: '1.2.3'});
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-1.23.js')).to.deep.equal({unversionned: 'https://domain.com/path/file.js', version: '1.23'});
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-12.3.beta.js')).to.deep.equal({unversionned: 'https://domain.com/path/file.js', version: '12.3.beta'});
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-1_2_3.js')).to.deep.equal({unversionned: 'https://domain.com/path/file.js', version: '1_2_3'});
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-1-2-3.js')).to.deep.equal({unversionned: 'https://domain.com/path/file-1-2.js', version: '3'});
        });

        it('returns false if it can\'t parse the version', function() {
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-1?2?3.js')).to.equal(false);
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file-.js')).to.equal(false);
            expect(swDelta.splitVersionFromUrl('https://domain.com/path/file.js')).to.equal(false);
            expect(swDelta.splitVersionFromUrl('https://domain.com/some-path/file.js')).to.equal(false);
        });
        
    });

});