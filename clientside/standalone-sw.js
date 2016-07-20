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