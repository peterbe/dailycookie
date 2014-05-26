/* Utility functions */
//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

// // console.log(window.speechSynthesis);
// // console.log(window.speechSynthesisPolyfill);
//  var fallbackSpeechSynthesis = window.speechSynthesis || window.speechSynthesisPolyfill;
//
// // console.log(window.SpeechSynthesisUtterance)
// // console.log(window.SpeechSynthesisUtterancePolyfill)
//  var fallbackSpeechSynthesisUtterance = window.SpeechSynthesisUtterance || window.SpeechSynthesisUtterancePolyfill;
// var fallbackSpeechSynthesis = window.speechSynthesisPolyfill;
// var fallbackSpeechSynthesisUtterance = window.SpeechSynthesisUtterancePolyfill;

var fallbackSpeechSynthesis = window.getSpeechSynthesis();
var fallbackSpeechSynthesisUtterance = window.getSpeechSynthesisUtterance();

function playWord(word, lang) {
    console.log(word, lang);
    var u = new fallbackSpeechSynthesisUtterance(word);
    lang = lang || 'en-US';
    u.lang = lang;
    u.volume = 1.0;
    u.rate = 1.0;
    // u.onend = function(event) { console.log('Finished in ' + event.elapsedTime + ' seconds.'); };
    fallbackSpeechSynthesis.speak(u);
}


angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {
})

//.controller('FriendsCtrl', function($scope, Friends) {
//    $scope.friends = Friends.all();
//})

//.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
//    $scope.friend = Friends.get($stateParams.friendId);
//})
//

.controller('SettingsCtrl', function($scope) {
})


.controller('AccountCtrl', function($scope) {
})


.controller('PlayCtrl', function($scope, $http, $location, $timeout) {

    $scope.questions = [];
    $scope.clicked = null;
    $scope.question = null;
    $scope.finished = false;
    $scope.was_correct = false;
    $scope.next_question = 0;

    $http.get('http://cookie/questions/', {geometry: '200'})
    .success(function(response) {
        // the database contains multiple correct answers per
        // every picture, so flatten that list
        var questions = [];
        response.questions.forEach(function(question) {
            // console.log(question);
            var incorrects = shuffle(question.incorrect.slice());

            question.correct.forEach(function(correct) {
                questions.push({
                    correct: correct,
                    incorrect: incorrects.slice(0, 4),
                    picture: question.picture,
                    locale: response.locale
                });
            });
        });

        questions = shuffle(questions);

        $scope.questions = questions;
        $scope.locale = response.locale;
        setNextQuestion();

    })
    .error(function(status) {
        console.error(status);
    });


    var setNextQuestion = function() {
        if ($scope.next_question >= $scope.questions.length) {
            finishedQuestions();
            return;
        }
        // do some resetting
        $scope.clicked = null;
        $scope.question = null;
        $scope.was_correct = false;
        var question = $scope.questions[$scope.next_question];

        console.log('Question', question);
        $scope.next_question++;
        question.choices = question.incorrect.slice();  // copy
        question.choices.push(question.correct);
        question.choices = shuffle(question.choices);
        // question is ready to be displayed
        $scope.question = question;
    };

    var finishedQuestions = function() {
        $scope.question = null;
        $scope.finished = true;
    };

    var next_timer;

    $scope.submitAnswer = function(answer) {
        if ($scope.clicked) return;
        $scope.clicked = answer;
        playWord(answer, $scope.question.locale);
        $scope.was_correct = $scope.question.correct === answer;
        if ($scope.was_correct) {
            next_timer = $timeout(function() {
                setNextQuestion();
            }, 3 * 1000);
        }
    };

    $scope.forwardNextQuestion = function() {
        $timeout.cancel(next_timer);
        setNextQuestion();
    };

    $scope.isCorrect = function(alternative) {
        if (!$scope.question) return;
        return $scope.clicked === alternative && $scope.clicked === $scope.question.correct;
    };

    $scope.isIncorrect = function(alternative) {
        if (!$scope.question) return;
        return $scope.clicked === alternative && $scope.clicked !== $scope.question.correct;
    };

    $scope.showLoading = function() {
        return !$scope.question && !$scope.finished;
    };

    $scope.showCorrect = function() {
        return $scope.clicked && $scope.was_correct;
    };

    $scope.showIncorrect = function() {
        return $scope.clicked && !$scope.was_correct;
    };

});
