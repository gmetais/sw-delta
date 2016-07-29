var SwDelta = require('../../index');

var settings = {
    files: [
        '/assets/*.js'
    ],
    removeCookies: true
};

var swDeltaInstance = new SwDelta(settings);

self.addEventListener('fetch', swDeltaInstance.onFetch);

self.addEventListener('activate', function () {
    console.log('[sw-delta service worker] Activated');
});