angular.module('cms.controllers').controller('DashController',
['$scope', '$location', '$http',
function($scope, $location, $http) {

    $http.get('/questions/groups')
    .success(function(response) {
        $scope.groups = response.groups;
        console.log(response.groups);

    });

    $scope.gotoGroup = function(id) {
        $location.path('/cms/' + id);
    };

}]
);
