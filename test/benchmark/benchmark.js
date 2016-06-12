'use strict';

var zlib            = require('zlib');
var fs              = require('fs');
var path            = require('path');
var Q               = require('q');

var deltaCalculator = require('../../serverside/deltaCalculator.js');
var deltaApplier    = require('../../clientside/deltaApplier.js');

var filesToTest     = require('./files.json');


var totalServerTime = 0;
var totalClientTime = 0;
var totalNewFileSize = 0;
var totalDeltaSize = 0;
var totalNewFileCompressedSize = 0;
var totalDeltaCompressedSize = 0;

function testOneFile(file) {
    var deferred = Q.defer();

    var oldFile = fs.readFileSync(path.join(__dirname, '../../', file.oldFile), 'utf-8');
    var newFile = fs.readFileSync(path.join(__dirname, '../../', file.newFile), 'utf-8');

    var startTime = Date.now();
    var delta = deltaCalculator.getDelta(oldFile, newFile);
    var deltaTime = Date.now();
    var newNewFile = deltaApplier.applyDelta(oldFile, delta);
    var endTime = Date.now();

    if (newNewFile !== newFile) {
        deferred.reject('ERROR: file generated from delta doesn\'t equal the original file (' + file.newFile + ')');
        return;
    }

    zlib.gzip(new Buffer(newFile, 'utf8'), function(err, newFileBuffer) {
        if (err) {
            deferred.reject('Could not compress new file with gzip');
        } else {
            var newFileCompressedSize = newFileBuffer.length;

            zlib.gzip(new Buffer(delta, 'utf8'), function(err, deltaBuffer) {
                if (err) {
                    deferred.reject('Could not compress delta with gzip');
                } else {

                    var serverTime = deltaTime - startTime;
                    var clientTime = endTime - deltaTime;
                    var newFileSize = newFile.length;
                    var deltaSize = delta.length;
                    var deltaCompressedSize = deltaBuffer.length;

                    totalServerTime += serverTime;
                    totalClientTime += clientTime;
                    totalNewFileSize += newFileSize;
                    totalDeltaSize += deltaSize;
                    totalNewFileCompressedSize += newFileCompressedSize;
                    totalDeltaCompressedSize += deltaCompressedSize;
                    
                    console.log('\nFile ' + file.newFile);
                    console.log('Server time: ' + serverTime + 'ms');
                    console.log('Client time: ' + clientTime + 'ms');
                    console.log('Uncompressed delta size: ' + deltaSize + ' bytes (' + Math.round(deltaSize*100/newFileSize) + '% of newFile)');
                    console.log('Gzipped delta size: ' + deltaCompressedSize + ' bytes (' + Math.round(deltaCompressedSize*100/newFileCompressedSize) + '% of newFile)');

                    deferred.resolve();
                }
            });
        }
    });

    return deferred.promise;
}

function testOneFilePromise(file) {
    return testOneFile(file);
}


Q.all(filesToTest.files.map(testOneFilePromise))

    .then(function(results) {
        console.log('\nBenchmark is complete!');
        console.log('Total server time: ' + totalServerTime + 'ms');
        console.log('Total client time: ' + totalClientTime + 'ms');
        console.log('Total uncompressed delta size: ' + totalDeltaSize + ' bytes (' + Math.round(totalDeltaSize*100/totalNewFileSize) + '% of newFiles)');
        console.log('Total gzipped delta size: ' + totalDeltaCompressedSize + ' bytes (' + Math.round(totalDeltaCompressedSize*100/totalNewFileCompressedSize) + '% of newFile)');
    })

    .fail(function(error) {
        console.log(error);
    });