
Continuous delivery is great, but it comes at a price on performances. The more you deliver, the less browsers will use assets they had in cache, because of file versionning. Even if you only changed one letter in a file, it will get downloaded entirely.


## Service Workers to the rescue

**sw-delta** is a project that makes the browser **download only the delta** (=diff) between the previously cached file and the required version of the file. It is based on the Service Worker API.

It is designed as a progressive enhancement. Browsers that don't support Service Workers will redownload the full file as they've always done, while modern browsers will be able to ask for the delta only.


## How does it work?

**Client-side:** a Service Worker intercepts every outgoing request. If the url matches one of the configured routes, than the Service Worker will compare the requested version with the version stored in cache. If an update is needed, the Service Worker will update the url to add the known version as a querystring, like this:

```
Asked url:          http://domain.com/js/main-1.2.0.js
Version in cache:   1.1.1
Updated url:        http://domain.com/js/main-1.2.0.js?cached=1.1.1
```

**Server-side:** the sw-delta querystring is recognized. If the server is able to find both versions in its file system, it computes a delta file and sends it to the browser.

**Back to client-side:** the Service Worker generates the requested file from the known old file and the delta file, stores it in cache and sends it to the page.


## Installation

You need to install the project both client-side and server-side.

[List of server-side implementations](https://github.com/gmetais/sw-delta/wiki/Server-side-implementations)

[Client-side installation documentation.](https://github.com/gmetais/sw-delta/wiki/Installation)


## API and configuration

[Client-side API documentation.](https://github.com/gmetais/sw-delta/wiki/API)


## Questions/Answers

#### Is it production ready?
No, I don't think so. This is just the beginning of this project. I'm looking for beta-testers.

#### What browsers are supported?
Chrome, Firefox and Opera. This is 59% of compatible browsers, according to [Can I Use](http://caniuse.com/#feat=serviceworkers).

#### Is it easy to install, client-side?
The client-side should not be a problem. Your website needs to be served on HTTPS, this is a limitation built in the Service Worker API. Then you only need to load the service worker and it deals with everything. No other change is required on to the page.

#### Is it easy to install, server-side?
It's a bit more complicated. Your server needs to be able to handle delta requests and to compute them.

#### What server-side technologies are compatible?
For the moment, I only wrote [the NodeJS library, called sw-delta-nodejs](https://github.com/gmetais/sw-delta-nodejs). But any other language should be able to run sw-delta. It could also become a module for Apache and Nginx.

#### How fast is the delta generation, server-side?
It's slow. Calculating the delta for file such as `angular.1.4.5-min.js` (143KB) takes 500ms. The delta files should not be re-generated for every user. You'd better use sw-delta behind a reverse proxy (or a CDN) that is able to cache the generated delta files.

#### How fast does it take to apply the delta, client-side?
This is pretty fast. The same `angular.1.4.5-min.js` file only takes 3ms to be regenerated from the delta.

#### What's the size of a delta file?
I've built a quick benchmark that measures the size of the delta files, on a few famous libraries (testing for example jQuery being upgraded from v2.0.0 to v2.0.1). **The average delta file is 14% of the normal file.**

#### What's the algorithm behind the delta file computation?
I'm using the [diff-match-patch](https://github.com/ForbesLindesay/diff-match-patch) npm module, which is a NodeJS wrapper around [google-diff-match-patch](https://code.google.com/p/google-diff-match-patch/). Then I compress the output in a home-made format. I'm pretty sure some improvements can be achieved on the speed and weight, don't hesitate if you have some ideas and use the [benchmark.js](/test/benchmark/benchmark.js) script to test them.

#### Once installed on my project, how can I debug/see it in action?
Using Chrome's Network panel, you are able to see one request from the page to the Service Worker, and another request from the Service Worker to the server. Firefox is not as good as Chrome, it does not show the requests from the SW.

#### Why does sw-delta use IndexedDB instead of the Cache API in its Service Worker?
Because the Cache API does not allow the modification of a file before storing it into the cache.

#### Do I need to keep all my old files versions on my server?
Yes, it is best to keep them all. But it won't stop working if some files get deleted so you can delete the oldest ones if you need some disk space.

#### How should I name/version my files to be compatible with sw-delta?
Currently, the only supported format is `/path/name-version.ext`. The version can be any string. I recommend changing the version only when the content is modified, to avoid unnecessary requests. An md5 hash of the file makes a perfect version number.


## Help is needed
Any kind of help is more than welcome. If your use case requires a modification of the source code, than you're probably not the only one: please open an issue or a pull-request ;)


## Author
Gaël Métais. I'm a webperf freelance. Follow me on Twitter [@gaelmetais](https://twitter.com/gaelmetais), I tweet about Web Performances and Front-end!

I can also help your company implement Service Workers, visit [my website](https://www.gaelmetais.com).
