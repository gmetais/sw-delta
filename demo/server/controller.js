var path        = require('path');
var app         = require('express')();
var url         = require('url');
var crypto      = require('crypto');
var compress    = require('compression');
var swDelta     = require('../../serverside/index');

app.use(compress());

app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, '../client/demo.html'));
});

app.get('/sw-delta.js', function (req, res) {
    res.sendFile(path.resolve(__dirname, '../../clientside/build/sw-delta.js'));
});

app.get('/assets/scripts/:name-:version.js', function(req, res) {
    // We look at the querystring to determine if the browser already has a version of the file in cache

    if (req.query.cached) {
        // With querystring

        var askedVersion = req.params.version;
        var cachedVersion = req.query.cached;
        console.log('Asked version: %s - Cached version: %s', askedVersion, cachedVersion);

        // The library needs the real paths of both the asked file and the cached file
        var pathname = url.parse(req.url).pathname;
        var askedFilePath = path.join(__dirname, '../client', pathname);
        var cachedFilePath = path.join(__dirname, '../client', pathname.replace(askedVersion, cachedVersion));

        console.log('askedFilePath: %s', askedFilePath);
        console.log('cachedFilePath: %s', cachedFilePath);

        // The getDelta method returns a promise
        swDelta.getDelta(askedFilePath, cachedFilePath)

            .then(function(result) {
                res.type(result.contentType);
                res.send(result.body);
            })

            .catch(function(error) {
                console.log('An error occured: %s %s', error.statusCode, error.status);
                res.status(error.statusCode).send(error.status);
            });

    } else {
        // No querystring, it's just a normal request, grab the file and send it...
        res.sendFile(path.join(__dirname, '../client', req.url));
    }

});

app.listen(3000, function () {
    console.log('Demo app listening on port 3000. Open your browser on http://localhost:3000');
});