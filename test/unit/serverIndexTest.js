var expect          = require('chai').expect;
var fs              = require('fs');
var path            = require('path');
var SwDelta         = require('../../serverside/index.js');

describe('Server Index', function() {
  
    describe('the SwDelta module', function() {

        it('is a constructor', function() {
            expect(SwDelta).to.be.a('function');
        });

        it('can be instanciated', function() {
            var swDelta = new SwDelta();
            expect(swDelta).to.be.an('object');
        });

        
    });

    describe('the "get" function fails', function() {

        it('if the filePath parameters is missing', function(done) {
            var swDelta = new SwDelta();
            
            swDelta.get()

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                expect(error).to.have.a.property('code').that.equals(400);
                expect(error).to.have.a.property('message').that.equals('Bad request: missing filepath');
                done();
            });
        });

        it('if the filePath parameters is empty', function(done) {
            var swDelta = new SwDelta();
            
            swDelta.get('')

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                expect(error).to.have.a.property('code').that.equals(400);
                expect(error).to.have.a.property('message').that.equals('Bad request: missing filepath');
                done();
            });
        });

        it('if the two versions asked are equal', function(done) {
            var swDelta = new SwDelta();
            
            swDelta.get('whatever', '1234', '1234')

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                expect(error).to.have.a.property('code').that.equals(400);
                expect(error).to.have.a.property('message').that.equals('Bad request: identical versions asked');
                done();
            });
        });

    });

    describe('the "get" function sends', function() {

        it('the entire file if no currentVersion is set', function(done) {
            var smallText1Content = fs.readFileSync(path.join(__dirname, 'fixtures/small-text-1.txt'), 'utf8');
            var swDelta = new SwDelta();
            
            swDelta.get(path.join(__dirname, 'fixtures/small-text.txt'), '1')

            .then(function(response) {
                expect(response).to.have.a.property('code').that.equals(200);
                expect(response).to.have.a.property('body').that.equals(smallText1Content);
                done();
            })

            .fail(function(error) {
                done(error);
            });
        });

        it('a 404 error if not currentVersion and the askedVersion is not found', function(done) {
            var swDelta = new SwDelta();
            
            swDelta.get(path.join(__dirname, 'does-not-exist.js'), '1')

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                expect(error).to.have.a.property('code').that.equals(404);
                expect(error).to.have.a.property('message').that.equals('Not found');
                done();
            });
        });

        it('a 500 error if there is another server error', function(done) {
            
            // Change the reading rights of a file to none
            fs.chmodSync(path.join(__dirname, 'fixtures/chmod222-1.txt'), '222');

            var swDelta = new SwDelta();
            
            swDelta.get(path.join(__dirname, 'fixtures/chmod222.txt'), '1')

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                expect(error).to.have.a.property('code').that.equals(500);
                expect(error).to.have.a.property('message').that.have.string('Internal Server Error: EACCES');
                done();
            })

            .finally(function() {
                fs.chmodSync(path.join(__dirname, 'fixtures/chmod222-1.txt'), '777');
            });
        });

        it('the entire file if currentVersion file is not found', function(done) {
            var smallText1Content = fs.readFileSync(path.join(__dirname, 'fixtures/small-text-1.txt'), 'utf8');
            var swDelta = new SwDelta();
            
            swDelta.get(path.join(__dirname, 'fixtures/small-text.txt'), '1', '0')

            .then(function(response) {
                expect(response).to.have.a.property('code').that.equals(200);
                expect(response).to.have.a.property('body').that.equals(smallText1Content);
                done();
            })

            .fail(function(error) {
                done(error);
            });
        });

        it('the entire file if askedVersion file is not found', function(done) {
            var smallText2Content = fs.readFileSync(path.join(__dirname, 'fixtures/small-text-2.txt'), 'utf8');
            var swDelta = new SwDelta();
            
            swDelta.get(path.join(__dirname, 'fixtures/small-text.txt'), '3', '2')

            .then(function(response) {
                expect(response).to.have.a.property('code').that.equals(200);
                expect(response).to.have.a.property('body').that.equals(smallText2Content);
                done();
            })

            .fail(function(error) {
                done(error);
            });
        });

        it('a 404 error if both files are not found', function(done) {
            var swDelta = new SwDelta();
            
            swDelta.get(path.join(__dirname, 'fixtures/small-text.txt'), '4', '3')

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                expect(error).to.have.a.property('code').that.equals(404);
                expect(error).to.have.a.property('message').that.equals('Not found');
                done();
            });
        });

        it('the delta if everything was alright', function(done) {
            var swDelta = new SwDelta();
            
            swDelta.get(path.join(__dirname, 'fixtures/small-text.txt'), '2', '1')

            .then(function(response) {
                try {
                    expect(response).to.have.a.property('code').that.equals(200);
                    expect(response).to.have.a.property('body').that.is.a('String');
                    done();
                } catch(err) {
                    done(err);
                }
            })

            .fail(function(error) {
                done(error);
            });
        });

    });
});