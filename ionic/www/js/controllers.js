/* Utility functions */
//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function _playWord(word) {
    // console.log(word);
    if (Audio) {
        console.log('About to play', word.mp3file);
        var clip = new Audio(word.mp3file);
        clip.play();
    } else {
        var el = document.getElementById('audio-' + word.id);
        if (!el) {
            console.warn('No audio element for:' + word.word);
            return;
        }
        el.play();
    }
}


angular.module('starter.controllers', [])

.controller('TabsController', function($scope) {
    $scope.show = false;
})

.controller('DashCtrl', function($scope) {
    // my_media = new Media('/words-mp3/2014/06/01/05a4cf56e53ee4edb1ffe8bd0c7db262.mp3',
    //     function() {
    //         console.log('it worked');
    //     }, function() {
    //         console.error('couldnt play');
    //     });
    // my_media.play();
    // var myAudio = new Audio("http://cookie/words-mp3/2014/06/01/05a4cf56e53ee4edb1ffe8bd0c7db262.mp3");
    // myAudio.play();
})

//.controller('FriendsCtrl', function($scope, Friends) {
//    $scope.friends = Friends.all();
//})

//.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
//    $scope.friend = Friends.get($stateParams.friendId);
//})
//

.controller('SettingsCtrl', function($scope, $timeout, $localForage, Config) {
    $scope.saving = false;
    $scope.saved = false;
    $scope.invalid = [];

    $scope.loading = true;
    $scope.settings = {};
    Config.load().then(function() {
        $scope.loading = false;
        $scope.settings.batch_size = Config.get('batch_size');
        $scope.settings.next_question_delay = Config.get('next_question_delay');
        $scope.settings.playsounds = Config.get('playsounds');
    });

    $scope.saveSettings = function() {
        $scope.invalid = [];
        if (_validate()) {
            _save();
        }

    };

    var _validate = function(data) {
        var valid = true;

        // validate batch_size
        var batch_size = $scope.settings.batch_size;
        if (_isInt(batch_size)) {
            // but is the number ok?
            batch_size = parseInt(batch_size, 10);
            if (!(batch_size > 1 && batch_size <= 100)) {
                $scope.invalid.batch_size = true;
                valid = false;
            }
        } else {
            // was invalid
            $scope.invalid.batch_size = true;
            valid = false;
        }

        // validate next_question_delay
        var next_question_delay = $scope.settings.next_question_delay;
        if (_isInt(next_question_delay)) {
            next_question_delay = parseInt(next_question_delay, 10);
            if (next_question_delay < 0 || next_question_delay > 60) {
                valid = false;
                $scope.invalid.next_question_delay = true;
            }
        } else {
            valid = false;
            $scope.invalid.next_question_delay = true;
        }

        return valid;
    };

    var _isInt = function(x) {
        var y = parseInt(x, 10);
        return !isNaN(y) && x == y && x.toString() == y.toString();
    };

    var _save = function() {
        $scope.saving = true;
        // final cast before it goes into JSON save
        //$scope.settings.batch_size = parseInt($scope.settings.batch_size, 10);
        //$scope.settings.next_question_delay = parseInt($scope.settings.next_question_delay, 10);
        //console.log('About to save', $scope.settings);

        $localForage.setItem('settings', $scope.settings).then(function() {
            $scope.saving = false;
            $scope.saved = true;
            $timeout(function() {
                $scope.saved = false;
            }, 2 * 1000);
        });
    };
})


.controller('AccountCtrl', function($scope) {
})


.controller('PlayCtrl', function($scope, $http, $location, $timeout, $interval, $ionicModal, Config) {

    // a database of ALL questions
    $scope.all_questions = [];
    $scope.questions = [];
    $scope.clicked = null;
    $scope.question = null;
    $scope.finished = false;
    $scope.was_correct = false;
    $scope.next_question = 0;
    $scope.streak = 0;
    $scope.attempts = {};

    // UI
    $scope.title = 'Play';
    $scope.temporary_title = null;

    // used for pre-loading
    $scope.words = [];
    $scope.pictures = [];

    $http.get('http://cookie/questions/', {geometry: 'x300'})
    .success(function(response) {
        // the database contains multiple correct answers per
        // every picture, so flatten that list
        var all_questions = [];
        response.questions.forEach(function(question) {
            // console.log(question);
            var incorrects = shuffle(question.incorrect.slice());

            question.correct.forEach(function(correct) {
                // console.log('CORRECT', correct);
                all_questions.push({
                    correct: correct,
                    incorrects: incorrects.slice(0, 4),
                    picture: question.picture,
                    locale: response.locale
                });
            });
        });

        $scope.all_questions = all_questions;
        console.log('Downloaded ' + $scope.all_questions.length + ' questions');
        $scope.locale = response.locale;
        Config.load().then(function() {
            pickNextQuestions(function() {
                initAttempts();
                downloadPictures(function() {
                    downloadAudioFiles();
                });
            });
            setNextQuestion();


        });

    })
    .error(function(status) {
        console.error(status);
    });

    $scope.playWord = function(word) {
        _playWord(word);
    };

    $scope.isClicked = function(word) {
        return $scope.clicked && word.id === $scope.clicked.id;
    };

    var pickNextQuestions = function(callback) {
        // let's suppose you have no previous questions
        // pick `batch_size` new questions now
        var questions = shuffle($scope.all_questions).slice(
            0,
            Config.get('batch_size')
        );
        $scope.questions = questions;
        callback();
    };

    var initAttempts = function() {
        var attempts = {};
        $scope.questions.forEach(function(question) {
            // console.log(question.correct);
            attempts[question.correct.id] = [];
        });
        $scope.attempts = attempts;
    };

    var downloadPictures = function(callback) {
        var pictures = [];
        var ids = {};
        $scope.questions.forEach(function(question) {
            if (!ids[question.picture.url]) {
                pictures.push(question.picture);
                ids[question.picture.url] = 1;
            }
        });
        $scope.pictures = pictures;
        callback();
    };

    var downloadAudioFiles = function() {
        var words = [];
        var ids = {};
        $scope.questions.forEach(function(question) {
            if (!ids[question.correct.id]) {
                words.push(question.correct);
                ids[question.correct.id] = 1;
            }
            question.incorrects.forEach(function(incorrect) {
                if (!ids[incorrect.id]) {
                    words.push(incorrect);
                    ids[incorrect.id] = 1;
                }
            });
        });
        $scope.words = words;
    };

    var setNextQuestion = function() {
        _updatePageTitle();
        if ($scope.next_question >= $scope.questions.length) {
            finishedQuestions();
            _updatePageTitle();
            return;
        }
        // do some resetting
        $scope.clicked = null;
        $scope.question = null;
        $scope.was_correct = false;
        var question = $scope.questions[$scope.next_question];

        question.choices = question.incorrects.slice();  // copy
        question.choices.push(question.correct);
        question.choices = shuffle(question.choices);
        // question is ready to be displayed
        $scope.question = question;
    };

    var _updatePageTitle = function() {
        if ($scope.next_question >= $scope.questions.length) {
            $scope.title = 'Finished';
        } else {
            $scope.title = 'Play (' + $scope.streak + '/' + Config.get('batch_size') + ')';
        }
    };

    var _temporaryPageTitle = function(msg, delay) {
        delay = delay || 2;
        $scope.temporary_title = msg;
        $timeout(function() {
            $scope.temporary_title = null;
        }, delay * 1000);
    };
    var _resetTemporaryPageTitle = function() {
        $scope.temporary_title = null;
    };

    var finishedQuestions = function() {
        $scope.question = null;
        $scope.finished = true;
        $scope.questions.forEach(function(question, i) {
            console.log(i);
            var attempts = $scope.attempts[question.correct.id];
            var sum = attempts.reduce(function(a, b) {
                return a + b;
            });
            question._correct_rate = sum / attempts.length;
            console.log(question._correct_rate);

        });
    };

    $ionicModal.fromTemplateUrl('modal.html', {
        scope: $scope,
        // backdropClickToClose: false,
        // animation: 'fade-'
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });
    $scope.openModal = function() {
        $scope.modal.show();
    };
    $scope.closeModal = function() {
        $scope.modal.hide();
    };
    // //Cleanup the modal when we're done with it!
    // $scope.$on('$destroy', function() {
    //     $scope.modal.remove();
    // });
    // // Execute action on hide modal
    // $scope.$on('modal.hide', function() {
    //     // Execute action
    //     $scope.forwardNextQuestion();
    // });
    // // Execute action on remove modal
    // $scope.$on('modal.removed', function() {
    //   // Execute action
    // });

    $scope.closeModalAndNextQuestion = function() {
        if (next_question_timeout) {
            $timeout.cancel(next_question_timeout);
        }
        $scope.modal.hide();
        $timeout(function() {
            $scope.forwardNextQuestion();
        }, 500);
    };

    $scope.modal_close_time_left = null;
    var close_countdown = null;
    var next_question_timeout = null;
    $scope.startModalCloseCountdown = function() {
        $scope.modal_close_time_left = Config.get('next_question_delay');
        next_question_timeout = $timeout(function() {
            $scope.closeModalAndNextQuestion();
            if (close_countdown) {
                $interval.cancel(close_countdown);
            }
        }, Config.get('next_question_delay') * 1000);
        if (close_countdown) {
            $interval.cancel(close_countdown);
        }
        close_countdown = $interval(function() {
            $scope.modal_close_time_left--;
        }, 1000);
    };

    var next_timer;

    $scope.submitAnswer = function(answer) {
        if ($scope.clicked) return;
        $scope.clicked = answer;
        $scope.was_correct = $scope.question.correct === answer;
        if (Config.get('playsounds') && $scope.was_correct) {
            $scope.playWord(answer);
        }

        $scope.modal.show();
        $scope.startModalCloseCountdown();

        // console.log('$scope.attempts', $scope.attempts);
        // the `0 + bool` turns the bool into 0 or 1
        $scope.attempts[$scope.question.correct.id].push(0 + $scope.was_correct);

        var next_question_delay = Config.get('next_question_delay');
        // console.log('next_question_delay=', next_question_delay);
        if ($scope.was_correct) {
            _temporaryPageTitle('Correct!', next_question_delay);
            $scope.streak++;
            $scope.next_question++;
            // next_timer = $timeout(function() {
            //     setNextQuestion();
            // }, next_question_delay * 1000);
        } else {
            // start over!
            _temporaryPageTitle('Starting over', next_question_delay);
            $scope.streak = 0;
            $scope.next_question = 0;
            $scope.questions = shuffle($scope.questions);
            // next_timer = $timeout(function() {
            //     setNextQuestion();
            // }, next_question_delay * 1000);
        }
        _updatePageTitle();
    };

    $scope.forwardNextQuestion = function() {
        $timeout.cancel(next_timer);
        _resetTemporaryPageTitle();
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
