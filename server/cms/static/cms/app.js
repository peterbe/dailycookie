angular.module('cms', [
    'ngRoute',
    'cms.controllers',
])

.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    // $locationProvider.html5Mode(false);

    $routeProvider
    .when('/cms/:group', {
        templateUrl: "/cms/partials/group.html",
        controller: 'GroupController'
    })
    .when('/cms/', {
        templateUrl: "/cms/partials/dashboard.html",
        controller:'DashController'
    })
    ;
}])


;
