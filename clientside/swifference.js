function onInit() {
    
}

function onFetch(event) {
    if (isFromMainDomain(url) && isTextFile(url)) {
        var requestedVersion = getVersion(url);

        // Si le fichier n'est pas en cache, on le récupère et on le met en cache
        // TODO

        // Si le fichier est déjà en cache
        // On compare les versions
    }
}

function isFromMainDomain(url) {
    // TODO
    return true;
}

function isTextFile(url) {
    // TODO
    return true;
}