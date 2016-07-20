var Q                   = require('q');
var fs                  = require('fs');
var mime                = require('mime');

var deltaCalculator     = require('./deltaCalculator');


var SwDelta = function() {
    'use strict';
    
    this.getDelta = function(askedFilePath, cachedFilePath) {
        var deferred = Q.defer();

        if (!askedFilePath || askedFilePath === '') {
            return Q.reject({
                statusCode: 400,
                status: 'Bad request: missing askedFilePath'
            });
        }
        if (!cachedFilePath || cachedFilePath === '') {
            return Q.reject({
                statusCode: 400,
                status: 'Bad request: missing cachedFilePath'
            });
        }

        // The allSettled method waits for both promises to complete
        Q.allSettled([
            Q.nfcall(fs.readFile, askedFilePath, 'utf-8'),
            Q.nfcall(fs.readFile, cachedFilePath, 'utf-8')
        ])

        .spread(function(askedFilePromise, cachedFilePromise) {

            if (askedFilePromise.state === 'rejected' && cachedFilePromise.state === 'rejected') {
                console.log('both files not found: ' + askedFilePath + ' and ' + cachedFilePath);
                deferred.reject(notFoundResponse(askedFilePromise.reason));
            } else if (askedFilePromise.state === 'rejected') {
                console.log('asked file not found: ' + askedFilePath);
                deferred.resolve(fileResponse(cachedFilePromise.value, cachedFilePath));
            } else if (cachedFilePromise.state === 'rejected') {
                console.log('cached file not found: ' + cachedFilePath);
                deferred.resolve(fileResponse(askedFilePromise.value, askedFilePath));
            } else {
                var delta = deltaCalculator.getDelta(cachedFilePromise.value, askedFilePromise.value);

                // Check that the diff is not bigger than the asked file:
                if (delta.length > 0.9 * askedFilePromise.value.length) {
                    console.log('diff size is too big, returning the asked file instead');
                    deferred.resolve(fileResponse(askedFilePromise.value, askedFilePath));
                    return;
                }

                deferred.resolve(deltaResponse(delta));
            }

        });

        return deferred.promise;
    };

    function deltaResponse(delta) {
        return {
            body: delta,
            contentType: 'text/sw-delta'
        };
    }

    function fileResponse(body, filePath) {
        return {
            body: body,
            contentType: mime.lookup(filePath)
        };
    }

    function notFoundResponse(error) {
        if (error.code === 'ENOENT') {
             return {
                statusCode: 404,
                status: 'Not found'
            };
        }
        
        return {
            statusCode: 500,
            status: 'Internal Server Error: ' + error.code
        };
    }
};

module.exports = new SwDelta();