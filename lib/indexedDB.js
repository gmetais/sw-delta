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
                 
                request.onsuccess = function() {
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