var expect          = require('chai').expect;
var fs              = require('fs');
var path            = require('path');
var swDelta         = require('../../serverside/index.js');

describe('Server Index', function() {
  
    describe('the swDelta module', function() {
        it('is an object', function() {
            expect(swDelta).to.be.an('object');
        });

        it('has a getDelta function', function() {
            expect(swDelta).to.have.a.property('getDelta').that.is.a('function');
        });
    });

    describe('the "getDelta" function', function() {
        it('returns a promise', function() {
            expect(swDelta.getDelta()).to.have.a.property('then').that.is.a('function');
            expect(swDelta.getDelta()).to.have.a.property('catch').that.is.a('function');
        })
    });

    describe('the "getDelta" function fails', function() {

        it('if the askedFilePath parameters is missing', function(done) {
            swDelta.getDelta()

            .then(function(response) {
                done(response);
            })

            .catch(function(error) {
                try {
                    expect(error).to.have.a.property('statusCode').that.equals(400);
                    expect(error).to.have.a.property('status').that.equals('Bad request: missing askedFilePath');
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('if the askedFilePath parameters is empty', function(done) {
            swDelta.getDelta('')

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                try {
                    expect(error).to.have.a.property('statusCode').that.equals(400);
                    expect(error).to.have.a.property('status').that.equals('Bad request: missing askedFilePath');
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('if the cachedFilePath parameters is missing', function(done) {
            swDelta.getDelta('some path')

            .then(function(response) {
                done(response);
            })

            .catch(function(error) {
                try {
                    expect(error).to.have.a.property('statusCode').that.equals(400);
                    expect(error).to.have.a.property('status').that.equals('Bad request: missing cachedFilePath');
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('if the cachedFilePath parameters is empty', function(done) {
            swDelta.getDelta('some path', '')

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                try {
                    expect(error).to.have.a.property('statusCode').that.equals(400);
                    expect(error).to.have.a.property('status').that.equals('Bad request: missing cachedFilePath');
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

    });

    describe('the "getDelta" function sends', function() {

        it('an empty diff if the two versions asked are equal', function(done) {
            swDelta.getDelta(path.join(__dirname, '../fixtures/small-text-1.txt'), path.join(__dirname, '../fixtures/small-text-1.txt'))

            .then(function(response) {
                try {
                    expect(response).to.have.a.property('body').that.equals('');
                    expect(response).to.have.a.property('contentType').that.equals('text/sw-delta');
                    done();
                } catch(err) {
                    done(err);
                }
            })

            .fail(function(error) {
                done(error);
            });
        });

        it('the entire asked file if the cached file is not found', function(done) {
            var smallText1Content = fs.readFileSync(path.join(__dirname, '../fixtures/small-text-1.txt'), 'utf8');
            
            swDelta.getDelta(path.join(__dirname, '../fixtures/small-text-1.txt'), path.join(__dirname, '../fixtures/small-text-999.txt'))

            .then(function(response) {
                expect(response).to.have.a.property('body').that.equals(smallText1Content);
                expect(response).to.have.a.property('contentType').that.equals('text/plain');
                done();
            })

            .fail(function(error) {
                done(error);
            });
        });

        it('the entire cached file if the asked file is not found', function(done) {
            var smallText1Content = fs.readFileSync(path.join(__dirname, '../fixtures/small-text-1.txt'), 'utf8');
            
            swDelta.getDelta(path.join(__dirname, '../fixtures/small-text-999.txt'), path.join(__dirname, '../fixtures/small-text-1.txt'))

            .then(function(response) {
                expect(response).to.have.a.property('body').that.equals(smallText1Content);
                expect(response).to.have.a.property('contentType').that.equals('text/plain');
                done();
            })

            .fail(function(error) {
                done(error);
            });
        });

        it('a 404 error if both files can\'t be found', function(done) {
            swDelta.getDelta(path.join(__dirname, 'does-not-exist-1.js'), path.join(__dirname, 'does-not-exist-2.js'))

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                expect(error).to.have.a.property('statusCode').that.equals(404);
                expect(error).to.have.a.property('status').that.equals('Not found');
                done();
            });
        });

        it('a 500 error if there is another server error', function(done) {
            
            // Change the reading rights of a file to none
            fs.chmodSync(path.join(__dirname, '../fixtures/chmod222-1.txt'), '222');

            swDelta.getDelta(path.join(__dirname, '../fixtures/chmod222-1.txt'), path.join(__dirname, '../fixtures/chmod222-1.txt'))

            .then(function(response) {
                done(response);
            })

            .fail(function(error) {
                try {
                    expect(error).to.have.a.property('statusCode').that.equals(500);
                    expect(error).to.have.a.property('status').that.have.string('Internal Server Error: EACCES');
                    done();
                } catch(err) {
                    done(err);
                }
            })

            .finally(function() {
                fs.chmodSync(path.join(__dirname, '../fixtures/chmod222-1.txt'), '777');
            });
        });

        it('the delta if everything was alright', function(done) {
            swDelta.getDelta(path.join(__dirname, '../fixtures/small-text-1.txt'), path.join(__dirname, '../fixtures/small-text-2.txt'))

            .then(function(response) {
                try {
                    expect(response).to.have.a.property('body').that.is.a('String');
                    expect(response).to.have.a.property('contentType').that.equals('text/sw-delta');
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