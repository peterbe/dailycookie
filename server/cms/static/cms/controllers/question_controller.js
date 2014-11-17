angular.module('cms').controller('QuestionController',
['$scope', '$http', '$modalInstance', 'question', 'questions',
function($scope, $http, $modalInstance, question, questions) {
    $scope.loading = false;
    $scope.new_word = '';
    $scope.new_word_explanation = '';

    $scope.question = question;

    $scope.removed_word = null;

    $scope.removeWord = function(word) {
        var data = {
            'remove': word.word,
        };
        $http.post('/cms/questions/' + $scope.question.id, data)
        .success(function(response) {
            $scope.removed_word = word;
            $scope.question.words.splice(
                $scope.question.words.indexOf(word),
                1
            );

        })
        .error(function() {
            console.error(arguments);
        });
    };

    $scope.addNewWord = function() {
        return _addWord($scope.new_word, $scope.new_word_explanation);
    };

    $scope.undoRemovedWord = function() {
        _addWord($scope.removed_word.word, $scope.removed_word.explanation);
        $scope.removed_word = null;
    };

    var _addWord = function(word, explanation) {
        var data = {
            word: word,
            explanation: explanation,
        };
        $http.post('/cms/questions/' + $scope.question.id, data)
        .success(function(response) {
            console.log('BEFORE', $scope.question.words.length, $scope.question.words);
            $scope.question.words.push(response.word);
            console.log('AFTER', $scope.question.words.length, $scope.question.words);
            $scope.new_word = '';
            $scope.new_word_explanation = '';
        })
        .error(function() {
            console.error(arguments);
        });
    };

    $scope.playAudio = function(index) {
        document.getElementById('audio-' + index).play();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
