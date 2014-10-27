angular.module('cms', [
    'ngRoute',
    'cms.controllers',
    'ui.bootstrap',
])

.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    // $locationProvider.html5Mode(false);

    $routeProvider
    .when('/cms/:group', {
        templateUrl: "group.html",
        controller: 'GroupController'
    })
    .when('/cms/:group/add', {
        templateUrl: "add.html",
        controller: 'AddController'
    })
    .when('/cms/', {
        templateUrl: "dashboard.html",
        controller:'DashController'
    })
    ;
}])


;
