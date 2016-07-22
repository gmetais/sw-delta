
Continuous delivery is great, but it comes at a price on performances. Because of file versionning, the more you deliver, the less browsers will use assets they had in cache. Even if you only changed one letter in a file, it will get downloaded from scratch.


## Service Workers to the rescue

**sw-delta** is a project that makes the browser **download only the delta** (=diff) between the previously cached file and the required version of the file. It is based on the Service Worker API and is designed as a progressive enhancement.

Browsers that don't support Service Workers will redownload the full file as they've always done, while modern browsers will be able to ask for the delta only.


## How does it work?

**Client-side**, a Service Worker intercepts every outgoing request. If the url matches on of the configured routes, than the Service Worker will compare the requested version with the version stored in cache. If file is found with a previous version, than the Service Worker will add the known version as a querystring:

```
Asked url:                  http://domain.com/js/main-1.2.0.js
Version found in cache:     1.1.1
Modified url:               http://domain.com/js/main-1.2.0.js?cached=1.1.1
```

**Server-side**, the sw-delta request is recognized. If the server is able to find both versions in its file system, it computes a delta file and sends it to the browser.

**Back to client-side**, the Service Worker generates the requested file from the known old file and the delta file, stores it in cache and sends it to the page.


## Q/A

##### Is it production ready?
No, I don't think so. This is just the beginning of this project. I'm looking for companies that wish to beta-test it.

##### What browsers are supported?
Chrome, Firefox and Opera. This is 59% of the navigators, according to [Can I Use](http://caniuse.com/#feat=serviceworkers).

##### Is it easy to install client-side?
The client-side should not be a problem if your website is on HTTPS (this is a limitation built in the Service Worker API). You only need to load the service worker and it deals with everything. No other change is required on to the page.

##### Is it easy to install server-side?
It's a bit more complicated. Your server needs to be able to handle delta requests and calculate them.

##### What server-side technologies are compatible?
For the moment, I only wrote a NodeJS library. My wish is to see some other libraries developped for other languages. It could also become Apache or Nginx modules.

##### How fast is the delta generation server-side?
It's slow. Calculating the delta for file such as `angular.1.4.5-min.js` (143KB) takes 500ms. The delta files should not be re-generated for every user. You'd better use sw-delta behind a reverse proxy (or a CDN) that is able to cache the generated delta files.

##### How fast does it take to apply the delta client-side?
This is pretty fast. The same `angular.1.4.5-min.js` file only takes 3ms to be regenerated.

##### What's the size of a delta file?
I've built a quick benchmark that measures the size of the delta files, on a few famous libraries (testing for example jQuery being upgraded from v2.0.0 to v2.0.1). **The average delta file is 14% of the normal file.**

##### What's the algorithm behind the delta file computation?
I'm using the [diff-match-patch](https://github.com/ForbesLindesay/diff-match-patch) npm module, which wraps google-diff-match-patch[https://code.google.com/p/google-diff-match-patch/]. Then I compress the output with a home-made format. I'm pretty sure some improvements can be achieved on speed and weight, don't hesitate if you have some ideas.

##### Once installed on my project, how can I see it in action/debug?
Using Chrome's Network panel, you are able to see one request from the page to the Service Worker, and another request from the Service Worker to the server. Firefox is not as good as Chrome for the moment.

##### Why does sw-delta use IndexedDB instead of the Cache API in the Service Worker?
Because it does not allow to modify a file before storing it into the cache.



## Author
Gaël Métais. I'm a webperf freelance. Follow me on Twitter [@gaelmetais](https://twitter.com/gaelmetais), I tweet about Web Performances and Front-end!

If you understand French, you can visit [my website](http://www.gaelmetais.com) (will be soon in English too).
