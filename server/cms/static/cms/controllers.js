var app = angular.module('cms.controllers', []);

app.controller('AppController',
    ['$scope', '$http', '$location',
    function($scope, $http, $location) {

    }]
);

app.controller('DashController',
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


app.controller('GroupController',
    ['$scope', '$location', '$routeParams', '$http',
    function($scope, $location, $routeParams, $http) {

        var id = parseInt($routeParams.group, 10);
        $http.get('/questions/groups', {id: id})
        .success(function(response) {
            response.groups.forEach(function(group) {
                if (group.id === id) {
                    $scope.group = group;
                }
            });
        })
        .error(function(){
            console.error(arguments);
        });

        $scope.words = [];
        $http.get('/questions/' + id)
        .success(function(response) {
            $scope.group = response.group;
            response.questions.forEach(function(question) {
                console.log(question);
                question.correct.forEach(function(word) {
                    if ($scope.words.indexOf(word) === -1) {
                        $scope.words.push(word);
                    }
                });

            });
        })
        .error(function(){
            console.error(arguments);
        });

    }]
);
