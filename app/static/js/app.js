angular.module('cookie', [
    'ngRoute',
    'cookie.controllers',
])

.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    // $locationProvider.html5Mode(true);
    $locationProvider.html5Mode(false);

    $routeProvider
    .when('/:username', {
        templateUrl: "/partials/play.html",
        controller: 'PlayController'
    })
    .when('/', {
        templateUrl: "/partials/start.html",
        controller:'StartController'
    })
    ;
}])


;
