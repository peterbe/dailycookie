var app = angular.module('cms.controllers', ['ui.bootstrap']);

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

        $scope.search = {};

        var id = parseInt($routeParams.group, 10);
        $http.get('/questions/groups', {id: id})
        .success(function(response) {
            response.groups.forEach(function(group) {
                if (group.id === id) {
                    $scope.group = group;
                    document.title = group.name;
                }
            });
        })
        .error(function(){
            console.error(arguments);
        });

        $scope.words = [];
        $scope.pictures = [];

        $http.get('/questions/' + id)
        .success(function(response) {
            $scope.group = response.group;
            var _pictures = [];
            var _words = [];
            response.questions.forEach(function(question) {
                var these_words = [];
                question.correct.forEach(function(word) {
                    these_words.push(word.word);
                    if (_words.indexOf(word) === -1) {
                        _words.push(word);
                    }
                });
                question.picture.words = these_words;
                _pictures.push(question.picture);
            });
            $scope.pictures = _pictures;
            $scope.words = _words;

        })
        .error(function(){
            console.error(arguments);
        });

        $scope.foundWords = function(word) {
            if (!$scope.search.word) return true;
            return (
                word.word.substring(0, $scope.search.word.length) === $scope.search.word
            );
        };

        $scope.foundPictures = function(picture) {
            if (!$scope.search.word) return true;
            var length = $scope.search.word.length;
            for (var i=0, len=picture.words.length;i<len;i++) {
                if (picture.words[i].substring(0, length) === $scope.search.word) {
                    return true;
                }
            }
            return false;
        };

    }]
);



app.controller('AddController',
    ['$scope', '$location', '$routeParams', '$http',
    function($scope, $location, $routeParams, $http) {

        var id = parseInt($routeParams.group, 10);
        console.log(id);
        $http.get('/questions/groups', {id: id})
        .success(function(response) {
            response.groups.forEach(function(group) {
                if (group.id === id) {
                    $scope.group = group;
                    document.title = 'Add word to ' + group.name;
                }
            });
        })
        .error(function(){
            console.error(arguments);
        });

    }]
);
