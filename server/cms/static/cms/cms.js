angular.module('cms', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
])

.config(['$routeProvider', '$locationProvider', '$httpProvider',
function ($routeProvider, $locationProvider, $httpProvider) {
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

.run(['$http', '$cookies', function($http, $cookies) {
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
}])

;
