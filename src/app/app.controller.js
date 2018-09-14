export default class AppCtrl {
    constructor($rootScope, $scope) {
        this.rootScope = $rootScope;
        this.scope = $scope;
    }
}

AppCtrl.$inject = [
    '$rootScope',
    '$scope'
];
