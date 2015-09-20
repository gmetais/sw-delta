/*jshint -W079 */

var Q       = require('q');
var fs      = require('fs');


var FileReader = function() {
    'use strict';

    var VERSION_SEPARATOR = '-';
    
    this.readFile = function(filePath, version) {
        var versionnedFilePath = this.getFilePathWithVersion(filePath, version);
        return Q.nfcall(fs.readFile, versionnedFilePath, 'utf-8');
    };

    this.getFilePathWithVersion = function(filePath, version) {
        var pathChunks = filePath.split('/');
        var name = pathChunks[pathChunks.length - 1];
        var nameChunks = name.split('.');
        var indexWhereToAddVersion = (nameChunks.length > 1) ? nameChunks.length - 2 : 0;

        nameChunks[indexWhereToAddVersion] += VERSION_SEPARATOR + version;
        pathChunks[pathChunks.length - 1] = nameChunks.join('.');
        
        return pathChunks.join('/');
    };
};

module.exports = new FileReader();