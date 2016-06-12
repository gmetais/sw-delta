var deltaApplier = require('./deltaApplier');

var SwDelta = function() {

    this.onInit = function() {

    };

    this.onFetch = function(event) {
        if (isFromMainDomain(url)) {
            var requestedVersion = getVersion(url);

            // Si le fichier n'est pas en cache, on le récupère et on le met en cache
            // TODO

            // Si le fichier est déjà en cache
            // On compare les versions
        }
    };

    this.isFromMainDomain = function(url) {
        // TODO
        return true;
    };

    this.splitVersion = function(url) {
        var regex = /^(.+)-([^\?\/-]+)\.([a-zA-Z0-9]+)/;
        var regexResult = regex.exec(url);

        if (!regexResult) {
            return false;
        }

        return {
            unversionned: regexResult[1] + '.' + regexResult[3],
            version: regexResult[2]
        };
    };
};

module.exports = new SwDelta();