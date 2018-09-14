import angular from 'angular';
import AppCtrl from './app.controller';

const MODULE_NAME = 'app';

var app = angular.module(MODULE_NAME, [
    ngRoute
])
    .directive('app', () => {
        return {
            templateUrl: 'app.html',
            replace: true,
            controller: AppCtrl,
            controllerAs: 'app'
        }
    })
    .controller('AppCtrl', AppCtrl)

app.config(($routeProvider) => {
    $routeProvider
        .when('/', {
            templateUrl: 'login.html'
        })
        .otherwise({
            redirectTo: '/'
        })
})

export default MODULE_NAME;