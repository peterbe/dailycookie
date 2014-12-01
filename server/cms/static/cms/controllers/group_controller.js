angular.module('cms').controller('GroupController',
['$scope', '$location', '$routeParams', '$http', '$modal',
function($scope, $location, $routeParams, $http, $modal) {

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

                // console.log(question._words);
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
        for (var i=0, len=picture.words.length; i<len; i++) {
            if (picture.words[i].word.substring(0, length) === $scope.search.word) {
                return true;
            }
        }
        return false;
    };

    $scope.openQuestionModal = function(question) {

        var modalInstance = $modal.open({
          templateUrl: 'question.html',
          controller: 'QuestionController',
          // size: 'sm',
          resolve: {
            question: function() {
              return question;
            },
            questions: function() {
              return $scope.questions;
            },
          }
        });

        modalInstance.result.then(function () {
          // $scope.selected = selectedItem;
        }, function () {
          console.log('modal closed');
        });
    };

    $scope.highlightPictures = function(word) {
        if (word.word === $scope.search.word) {
            $scope.search.word = '';
        } else {
            $scope.search.word = word.word;
        }
    };

}]
);
