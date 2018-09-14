import MODULE_NAME from "./app";

function templateCache($templateCache) {
    $templateCache.put('app.html', require('./app.html'))
}

angular.module(MODULE_NAME).run(['$templateCache'], templateCache);

