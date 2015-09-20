var Q                   = require('q');
var fileReader          = require('./fileReader');
var deltaCalculator     = require('./deltaCalculator');


module.exports = function SwDelta(settings) {
    'use strict';
    
    //var rootUrl = settings.rootUrl || '';

    this.get = function(filePath, askedVersion, currentVersion) {
        if (!filePath || filePath === '') {
            return Q.reject(missingFilePathError());
        }

        if (askedVersion === currentVersion) {
            return Q.reject(sameVersionError());
        }

        var deferred = Q.defer();

        // First time the file is asked
        if (!currentVersion || currentVersion === '') {
            
            fileReader.readFile(filePath, askedVersion)

            .then(function(askedFileContent) {
                deferred.resolve(success(askedFileContent));
            })

            .fail(function(error) {
                deferred.reject(fileReadingError(error));
            });

        } else {

            // Not the first time
            Q.allSettled([
                fileReader.readFile(filePath, askedVersion),
                fileReader.readFile(filePath, currentVersion)
            ]).spread(function(askedFilePromise, currentFilePromise) {

                if (askedFilePromise.state === 'rejected' && currentFilePromise.state === 'rejected') {
                    deferred.reject(fileReadingError(askedFilePromise.reason));
                } else if (askedFilePromise.state === 'rejected') {
                    deferred.resolve(success(currentFilePromise.value));
                } else if (currentFilePromise.state === 'rejected') {
                    deferred.resolve(success(askedFilePromise.value));
                } else {
                    var delta = deltaCalculator.getDelta(currentFilePromise.value, askedFilePromise.value);
                    deferred.resolve(success(delta));
                }

            });

        }

        return deferred.promise;
    };


    function success(body) {
        return {
            code: 200,
            body: body
        };
    }

    function missingFilePathError() {
        return {
            code: 400,
            message: 'Bad request: missing filepath'
        };
    }

    function sameVersionError() {
        return {
            code: 400,
            message: 'Bad request: identical versions asked'
        };
    }

    function fileReadingError(error) {
        if (error.code === 'ENOENT') {
             return {
                code: 404,
                message: 'Not found'
            };
        }
        
        return {
            code: 500,
            message: 'Internal Server Error: ' + error.code
        };
    }
};