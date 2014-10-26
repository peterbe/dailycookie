/*global Dropzone */

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

    $scope.words = [];
    $scope.questions = [];
    // $scope.pictures = [];

    loadGroup(id).then(function() {
        loadQuestions(id);
    });


    function loadGroup(id) {
        return $http.get('/cms/groups/' + id)
        .success(function(response) {
            $scope.group = response;
            document.title = $scope.group.name;
        })
        .error(function(){
            console.error(arguments);
        });
    }

    function loadQuestions(id) {
        return $http.get('/cms/groups/' + id + '/questions')
        .success(function(response) {
            // $scope.group = response.group;
            $scope.questions = response.questions;
            // var _pictures = [];
            var _words = [];  // unique list across all questions
            response.questions.forEach(function(question) {
                // var these_words = [];
                question._words = [];
                question.words.forEach(function(word) {
                    question._words.push(word.word);
                    // these_words.push(word.word);
                    if (_words.indexOf(word) === -1) {
                        _words.push(word);
                    }
                });

                console.log(question._words);
                // question.picture.words = these_words;
                // _pictures.push(question.picture);
                // $scope.pictures.push(question.thumbnail);
            });
            // $scope.pictures = _pictures;

            $scope.words = _words;

        })
        .error(function(){
            console.error(arguments);
        });
    }


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


// Global



app.controller('AddController',
['$scope', '$location', '$routeParams', '$http',
function($scope, $location, $routeParams, $http) {

    var id = parseInt($routeParams.group, 10);
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

    Dropzone.autoDiscover = false;
    var myDropzone = new Dropzone("#dropzone", {
        url: "/cms/" + id + "/upload",
        paramName: "picture",
        init: function() {
            this.on("addedfile", function(file) {
                console.log("Added file.");
            });
        }

    });
    myDropzone.options.acceptedFiles = 'image/png,image/jpeg';


}]
);
