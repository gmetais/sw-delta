(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.worker = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DeltaApplier = function() {
    'use strict';

    this.applyDelta = function(oldString, delta) {

        // Extract the separator, which is the first char in the delta
        var separator = delta.substr(0, 1);
        var diffArray = delta.split(separator);
        diffArray.shift();

        var newString = '';
        var oldStringCursor = 0;
        var charIndex = 0;
        var deletedChars = 0;
        var regex = /(\d+)([+-])([\s\S]+)/m;
        var adding, chunks, numberOfCharsToRemove;

        for (var i = 0, max = diffArray.length; i < max; i++) {

            chunks = regex.exec(diffArray[i]);
            charIndex += parseInt(chunks[1], 10);
            
            var numberOfMissingChars = charIndex - deletedChars - newString.length;
            if (numberOfMissingChars > 0) {
                newString += oldString.substr(oldStringCursor, numberOfMissingChars);
                oldStringCursor += numberOfMissingChars;
            }

            adding = (chunks[2] === '+');

            if (adding) {
                newString += chunks[3];
            } else {
                // Removing
                numberOfCharsToRemove = parseInt(chunks[3], 10);
                deletedChars += numberOfCharsToRemove;
                oldStringCursor += numberOfCharsToRemove;
            }
        }

        // At the end, copy the remaining chars from the oldString
        if (oldStringCursor < oldString.length) {
            newString += oldString.substring(oldStringCursor);
        }

        return newString;
    };
};

module.exports = new DeltaApplier();
},{}],2:[function(require,module,exports){
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
},{"./deltaApplier":1,"./indexedDB":3,"calmcard":4}],3:[function(require,module,exports){
var IndexedDB = function(settings) {
    'use strict';

    var instance;
    var objectStoreName = 'cache';

    this.get = function(url) {
        return getDBInstance()
        
        .then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction([objectStoreName], 'readonly');
                var objectStore = transaction.objectStore(objectStoreName);
                 
                var request = objectStore.get(url);
                 
                request.onsuccess = function(event) {
                    resolve(event.target.result);
                };

                request.onerror = function(event) {
                    reject('Error while retrieving an entry from database: ' + event.target.errorCode);
                };
            });
        })

        .catch(function(err) {
            console.log(err);
            return null;
        });
    };

    this.set = function(obj) {
        return getDBInstance()
        
        .then(function(db) {
            return new Promise(function(resolve, reject) {
                var transaction = db.transaction([objectStoreName], 'readwrite');
                var objectStore = transaction.objectStore(objectStoreName);
                 
                var request = objectStore.put(obj);
                 
                request.onsuccess = function(event) {
                    console.log('Entry correctly added or modified in database');
                    resolve();
                };

                request.onerror = function(event) {
                    reject('Error while adding or modifying an entry into database: ' + event.target.errorCode);
                };
            });
        })

        .catch(function(err) {
            console.log(err);
        });
    };

    function getDBInstance() {
        if (instance) {
            return Promise.resolve(instance);
        }
        
        return openDB();
    }

    function openDB() {
        return new Promise(function(resolve, reject) {
            var request = indexedDB.open(settings.indexedDB.name, settings.indexedDB.version);
            
            request.onupgradeneeded = function(event) {
                console.log('The database needs to be created...');
                
                var db = event.target.result;
                if (!db.objectStoreNames.contains(objectStoreName)) {
                    db.createObjectStore(objectStoreName, {keyPath: 'url'});
                }
            };

            request.onerror = function(event) {
                reject('Error while opening database: ' + event.target.errorCode);
            };
            
            request.onsuccess = function(event) {
                instance = event.target.result;
                resolve(instance);
            };
        });
    }
};

module.exports = IndexedDB;
},{}],4:[function(require,module,exports){
/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var tokenize = require("./lib/tokenize");
var match = require("./lib/match");

/**
 * Matches a pattern against a string.
 * "*" is a wildcard for any sequence of characters.
 *
 * @param {string} The pattern to match against
 * @param {string} The String to match
 * @returns {boolean}
 */
module.exports = function(pattern, str) {
    return match(
        tokenize(pattern),
        str
    );
};

},{"./lib/match":5,"./lib/tokenize":6}],5:[function(require,module,exports){
/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

function match(tokens, str) {
    var curr, next, next_pos;
    var p = 0;

    while(tokens.length > 0) {
        curr = tokens.shift();
        if (curr[0] === 1) {
            //the current token is a wildcard
            next = tokens.shift();
            if (next) {
                /*
                 * there is also another token after it
                 * so we match for that with a prefix > 1 for the wildcard
                 */
                next_pos = str.indexOf(next[1]);
                if (next_pos > 0) {
                    //move the pointer to the end of the non-wildcard token
                    p = next_pos + next[1].length;
                } else {
                    //didn't fit. FAIL!
                    return false;
                }
            } else {
                //the current wildcard token is also the last token.
                if (str === "") {
                    //but there's nothing left to match. FAIL!
                    return false;
                }

                /*
                 * Since this last token is a wildcard.
                 * It uses up the rest of the string.
                 */
                str = "";
            }
        } else {
            // the current token is a string token
            if (str.indexOf(curr[1]) !== 0) {
                // it doesn't fit at the beginning. FAIL!
                return false;
            } else {
                // move pointer to the end of the string token
                p = p + curr[1].length;
            }
        }

        // cut the already matched part from the beginning of the string
        str = str.substr(p);
    }

    if (str.length > 0) {
        // the tokens didn't use up the 
        return false
    }

    // it did actually match. WOW!
    return true;
}

module.exports = match;

},{}],6:[function(require,module,exports){
/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

function tokenize(str) {
    var l = str.length;
    var i;
    var curr, next;
    var tokens = [];
    var tok = [0, ""];

    for (i = 0; i < l; i++) {
        curr = str.substr(i,1);
        if (curr === "*") {
            while (str.substr(i+1, 1) === "*") {
                // sequences of wildcards must be collapsed into one
                i++;
            }
            tokens.push(tok); // save the previously built srting token
            tokens.push([1]); //add a wildcard token
            tok = [0, ""]; //prepare a new string token
        } else if (curr === "\\") {
            // this is an escape sequence, skip to the next character
            i++;
            tok[1] += str.substr(i, 1);
        } else {
            tok[1] += curr;
        }
    }

    if (tok[0] === 1 || tok[0] === 0 && tok[1] !== "") {
        /*
         * Prevent an emoty string token at the end.
         */
        tokens.push(tok);
    }

    if (str !== "" && tokens[0][0] === 0 && tokens[0][1] === "") {
        /*
         * remove the empty string token at the beginning,
         * except if the whole pattern is an empty string.
         */
        tokens.shift();
    }

    return tokens;
}

module.exports = tokenize;

},{}],"sw-delta":[function(require,module,exports){
var SwDelta = require('./index.js');

var swDeltaInstance = new SwDelta({
    files: [
        '/assets/*.js'
    ],
    removeCookies: true
});

self.addEventListener('fetch', swDeltaInstance.onFetch);

self.addEventListener('activate', function (event) {
    console.log('[Service worker] Activated');
});
},{"./index.js":2}]},{},[])("sw-delta")
});