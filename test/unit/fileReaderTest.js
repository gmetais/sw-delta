var expect          = require('chai').expect;
var fs              = require('fs');
var path            = require('path');
var fileReader     = require('../../serverside/fileReader.js');

describe('FileReader', function() {
  
    describe('the "getFilePathWithVersion" function', function() {

        it('adds the version before the extension', function() {
            var fileName = fileReader.getFilePathWithVersion('file.ext', '1234');
            expect(fileName).to.equal('file-1234.ext');
        });

        it('adds the version at the end if there is no extension', function() {
            var fileName = fileReader.getFilePathWithVersion('file-with-no-extension', '1234');
            expect(fileName).to.equal('file-with-no-extension-1234');
        });

        it('adds the version even with a strange path', function() {
            var fileName = fileReader.getFilePathWithVersion('thats.a/strange.path/file.ext', '1234');
            expect(fileName).to.equal('thats.a/strange.path/file-1234.ext');
        });
        
    });


    describe('the "readFile" function', function() {

        it('succeeds succesfully', function(done) {
            var smallText1Content = fs.readFileSync(path.join(__dirname, '../fixtures/small-text-1.txt'), 'utf-8');
            
            fileReader.readFile(path.join(__dirname, '../fixtures/small-text.txt'), 1)

            .then(function(response) {
                expect(response).to.equal(smallText1Content);
                done();
            })

            .fail(function(error) {
                done(error);
            });
        });

        it('fails when the file is not found', function(done) {

            fileReader.readFile(path.join(__dirname, 'file/not-found.css'), 1)

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                expect(error).to.be.an('error');
                done();
            });
        });

    });

});