var calmcard        = require('calmcard');
var deltaApplier    = require('./deltaApplier');
var IndexedDB       = require('./indexedDB');

var SwDelta = function(userSettings) {
    var self = this;

    // Init settings
    var settings = {
        files: [],
        removeCookies: false,
        indexedDB: {
            name: 'sw-delta',
            version: 1
        }
    };
    for (var setting in userSettings) {
        settings[setting] = userSettings[setting];
    }

    // Init indexedDB
    var db = new IndexedDB(settings);


    this.onFetch = function(event) {
        
        var matching = settings.files.some(function(pattern) {
            if (pattern.indexOf('/') === 0) {
                // Relative path, add the domain
                pattern = this.location.origin + pattern;
            }
            return calmcard(pattern, event.request.url);
        });

        if (matching) {
            event.respondWith(self.goFindSomethingToAnswer(event.request.url));
        }
    };

    this.goFindSomethingToAnswer = function(askedUrl) {
        var splitedUrl = self.splitVersionFromUrl(askedUrl);
        var unversionnedUrl = splitedUrl.unversionned;
        var askedVersion = splitedUrl.version;

        return self.getFileFromCache(unversionnedUrl)

        .then(function(cachedFile) {
            if (cachedFile) {
                if (cachedFile.version === askedVersion) {
                    return new Response(cachedFile.body, {
                        status: 200,
                        statusText: 'OK',
                        headers: {'Content-Type': cachedFile.contentType}
                    });
                } else {
                    return self.fetchDelta(askedUrl, askedVersion, unversionnedUrl, cachedFile);
                }
            } else {
                console.log('File not found in cache, fetching...');
                return self.fetchFile(askedUrl, unversionnedUrl, askedVersion);
            }
        });
    };

    // Checks in IndexedDB if there is an entry for the given URL.
    // Returns an object {url, version, body} or null if not found.
    this.getFileFromCache = function(unversionnedUrl) {
        return db.get(unversionnedUrl);
    };

    // Insert a file in cache
    this.saveFileInCache = function(unversionnedUrl, version, contentType, body) {
        return db.set({
            url: unversionnedUrl,
            version: version,
            contentType: contentType,
            body: body
        })

        .then(function() {
            console.log('File correctly saved in cache');
        })

        .catch(function(error) {
            console.log('Error while saving file in cache: ', error);
        });
    };

    // Ask a delta to the server with the currently known version
    this.fetchDelta = function(askedUrl, askedVersion, unversionnedUrl, cachedFileObject) {
        var request = self.createFetchRequest(askedUrl + '?cached=' + cachedFileObject.version);

        return fetch(request)

        .then(function(response) {
            return response.text()

            .then(function(body) {
                var contentType = response.headers.get('Content-Type');

                // When a delta is anwsered, the content-type is 'text/sw-delta',
                // otherwise it's the files normal content-type.

                if (contentType.indexOf('text/sw-delta') === 0) {
                    var regeneratedFile = deltaApplier.applyDelta(cachedFileObject.body, body);

                    // Save new version in cache (asynchronous)
                    self.saveFileInCache(unversionnedUrl, askedVersion, cachedFileObject.contentType, regeneratedFile);

                    // And answer
                    return new Response(regeneratedFile, {
                        status: 200,
                        statusText: 'OK',
                        headers: {'Content-Type': cachedFileObject.contentType}
                    });
                } else {
                    // Save new version in cache (asynchronous)
                    self.saveFileInCache(unversionnedUrl, askedVersion, contentType, body);

                    return new Response(body, {
                        status: 200,
                        statusText: 'OK',
                        headers: {'Content-Type': contentType}
                    });
                }
            });
        });
    };

    // Ask a file to the server
    this.fetchFile = function(askedUrl, unversionnedUrl, askedVersion) {
        var request = self.createFetchRequest(askedUrl);

        return fetch(request)

        .then(function(response) {
            console.log('File fetched correctly');
            var clone = response.clone();
            
            // Save file in cache. 
            response.text().then(function(body) {
                var contentType = response.headers.get('Content-Type') || 'text/plain';
                return self.saveFileInCache(unversionnedUrl, askedVersion, contentType, body);
            });

            // Respond to the browser without waiting for the file to be correctly added in cache.
            return clone;
        })

        .catch(function(error) {
            console.error('Fetching failed: ', error);
            throw error;
        });
    };

    this.splitVersionFromUrl = function(url) {
        var regex = /^(.+)-([^\?\/-]+)\.([a-zA-Z0-9]+)$/;
        var regexResult = regex.exec(url);

        if (!regexResult) {
            return false;
        }

        return {
            unversionned: regexResult[1] + '.' + regexResult[3],
            version: regexResult[2]
        };
    };

    this.createFetchRequest = function(url) {
        return new Request(url, {credentials: settings.removeCookies ? 'omit' : 'same-origin'});
    };

};

module.exports = SwDelta;