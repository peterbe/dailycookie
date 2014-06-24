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

function average(arr) {
    var sum = arr.reduce(function(a, b) {
        return a + b;
    });
    return sum / arr.length;
}

angular.module('starter.controllers', [])

.controller('TabsController', function($scope) {
    $scope.show = false;
})

.controller('DebugCtrl', function($scope, $localForage) {
    $localForage.getItem('groups').then(function(groups) {
        $scope.groups = groups;
    });

    $scope.clearGroups = function() {
        $localForage.removeItem('groups').then(function() {
            $scope.groups = null;
        });
    };

})

.controller('DashCtrl', function($scope, $http, Past) {
    $scope.days = null;
    // $scope.all_groups = [];
    $scope.groups = {};
    $http.get('http://cookie/questions/groups/')
    .success(function(response) {
        Past.getGroups().then(function(groups) {
            $scope.all_groups = response.groups;
            $scope.groups = groups;
        });
    }).error(function() {
        alert('Unable to download question groups');
        console.error(arguments);
    });

    $scope.countDaysPlayed = function(group, groups) {
        if (!groups[group.id]) return 0;
        return groups[group.id].attempts.length;

    };

    $scope.countPlayedWords = function(group, groups) {
        // return how many words we have played
        if (!groups[group.id]) return 0;
        var attempts = groups[group.id].attempts;
        var words = {};
        var wordcount = 0;
        attempts.forEach(function(round) {
            for (var word in round) {
                if (!words[word]) {
                    words[word] = 1;
                    wordcount++;
                }
            }
        });

        return wordcount;
    };
})

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
        $scope.settings.max_range = Config.get('max_range');
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

        // validate max_range
        var max_range = $scope.settings.max_range;
        if (_isInt(max_range)) {
            max_range = parseInt(max_range, 10);
            if (max_range < 0 || max_range > 30) {
                valid = false;
                $scope.invalid.max_range = true;
            }
        } else {
            valid = false;
            $scope.invalid.max_range = true;
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


.controller('PlayCtrl',
    function($scope, $http, $location, $timeout, $interval, $stateParams,
             $ionicModal,
             Past, Config) {
    var group_id = $stateParams.id;
    // a database of ALL questions
    $scope.all_questions = [];
    $scope.questions = [];
    $scope.clicked = null;
    $scope.question = null;
    $scope.finished = false;
    $scope.was_correct = false;
    $scope.next_word = 0;
    $scope.streak = 0;
    $scope.attempts = {};

    // UI
    $scope.title = 'Play';
    $scope.temporary_title = null;

    // used for pre-loading
    $scope.words = [];
    $scope.pictures = [];

    var pickRandomWords = function(all_words, not, length) {
        // @all_words is an array of all possible word objects
        // @not is an array word objects it can't be
        // @length is how many we're supposed to return
        var not_ids = [];
        not.forEach(function(word) {
            not_ids.push(word.id);
        });
        all_words = shuffle(all_words);
        var random_words = [];
        var i = 0;
        while (random_words.length < length) {
            if (not_ids.indexOf(all_words[i].id) === -1) {
                random_words.push(all_words[i]);
            }
            i++;
        }
        return random_words;
    };

    $http.get('http://cookie/questions/' + group_id, {geometry: 'x300'})
    .success(function(response) {
        // the database contains multiple correct answers per
        // every picture, so flatten that list
        // $scope.group = response.group;
        Past.getGroup(response.group).then(function(group) {
            // console.log('RESPONSE');console.log(response);
            // console.log('GROUP'); console.log(group);
            $scope.group = group;

            // In the ajax response, all words are tucked under each
            // question.             // $scope.all_words = response.words;
            // $scope.all_words = [];
            var all_word_words = [];
            response.questions.forEach(function(question) {
                question.correct.forEach(function(word) {
                    all_word_words.push(word);
                });
            });
            // console.log('all_word_words', all_word_words);
            var all_words = {};
            response.questions.forEach(function(question) {
                question.correct.forEach(function(word) {
                    word.picture = question.picture;
                    word.incorrects = pickRandomWords(
                        all_word_words,
                        question.correct,
                        3
                    );
                    // console.log("INCORRECTS");
                    // console.log(word.incorrects);
                    // throw "STOP"
                    all_words[word.id] = word;
                });
            });
            $scope.all_words = all_words;
            // // var all_questions = {};
            // response.questions.forEach(function(question) {
            //     // console.log(question);
            //     //var incorrects = shuffle(question.incorrect.slice());
            //     var incorrects = pickRandomWords(
            //         $scope.all_words, question.correct, 3
            //     );
            //
            //     question.correct.forEach(function(correct) {
            //         // console.log('CORRECT', correct);
            //         all_questions.push({
            //             correct: $scope.all_words[correct],
            //             incorrects: incorrects,
            //             picture: question.picture,
            //             locale: response.locale
            //         });
            //     });
            // });
            // $scope.all_questions = all_questions;
            // console.log('Downloaded ' + $scope.all_questions.length + ' questions');
            $scope.locale = response.locale;
            Config.load().then(function() {
                pickNextQuestions(function() {
                    initAttempts();
                    downloadPictures(function() {
                        downloadAudioFiles(function() {
                            // console.log("WOrds:", $scope.words);
                            setNextQuestion();
                        });
                    });
                });
            });
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

    var calculateNextNoDays = function(score) {
        return parseInt(score * Config.get('max_range'), 10);
    };

    var pickNextQuestions = function(callback) {
        // loop over past played questions in reverse,
        var attempts = $scope.group.attempts;
        var words = [];
        var not_words = [];
        var id;
        var age;
        for (var i=attempts.length - 1; i>=0; i--) {
            // variable `i` is basically...
            age = i + 1;
            for (id in attempts[i]) {
                var score = average(attempts[i][id]);
                var days = calculateNextNoDays(score);
                console.log(age, id, score, days);
                // if it has been that many days, add it
                if (age >= days) {
                    words.push(id);
                } else {
                    not_words.push(id);
                }
            }
        }
        var remaining_words = [];
        for (id in $scope.all_words) {
            if (words.indexOf(id) === -1 && not_words.indexOf(id) === -1) {
                remaining_words.push(id);
            }
        }
        // fill up with more random other words
        words.push.apply(words, shuffle(remaining_words).slice(
            0,
            Config.get('batch_size') - words.length
        ));
        // console.log('Words:', words);
        var today_words = [];
        words.forEach(function(id) {
            today_words.push($scope.all_words[id]);
        });
        $scope.words = today_words;
        callback();
    };

    var initAttempts = function() {
        var attempts = {};
        $scope.words.forEach(function(word) {
            // console.log(question.correct);
            attempts[word.id] = [];
        });
        $scope.attempts = attempts;
    };

    var downloadPictures = function(callback) {
        var pictures = [];
        var ids = {};
        $scope.words.forEach(function(word) {
            if (!ids[word.picture.url]) {
                pictures.push(word.picture);
                ids[word.picture.url] = 1;
            }
        });
        // XXX
        // Consider loading it into the DOM here all in parallel and
        // count the number of callbacks and when the last is in then
        // we execute the callback.
        $scope.pictures = pictures;
        callback();
    };

    var downloadAudioFiles = function(callback) {
        var audiofiles = [];
        $scope.words.forEach(function(word) {
            audiofiles.push({
                mp3file: word.mp3file,
                id: word.id
            });
        });
        $scope.audiofiles = audiofiles;
        callback();
    };

    var setNextQuestion = function() {
        _updatePageTitle();
        if ($scope.next_word >= $scope.words.length) {
            finishedQuestions();
            _updatePageTitle();
            return;
        }
        // do some resetting
        $scope.clicked = null;
        $scope.question = null;
        $scope.was_correct = false;
        var word = $scope.words[$scope.next_word];

        word.choices = word.incorrects.slice();  // copy
        word.choices.push(word);
        word.choices = shuffle(word.choices);

        // console.log('CHOICES');
        // word.choices.forEach(function(alternative) {
        //     console.log(alternative.id, alternative.word);
        // });
        // console.log(' ');
        // question is ready to be displayed
        $scope.word = word;
    };

    var _updatePageTitle = function() {
        if ($scope.next_word >= $scope.words.length) {
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
        $scope.word = null;
        $scope.finished = true;
        $scope.words.forEach(function(word, i) {
            var attempts = $scope.attempts[word.id];
            var sum = attempts.reduce(function(a, b) {
                return a + b;
            });
            word._correct_rate = sum / attempts.length;
        });
        console.log('Calling rememberAttempts', $scope.group);
        Past.rememberAttempts($scope.group, $scope.attempts);
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

    $ionicModal.fromTemplateUrl('word-modal.html', {
        scope: $scope,
        // backdropClickToClose: false,
        // animation: 'fade-'
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.word_modal = modal;
    });
    $scope.openWordModal = function(id) {
        $scope.word_modal.show();
        $scope.word = $scope.all_words[id];
        var attempts = $scope.attempts[$scope.word.id];
        // console.log('all attempts', $scope.attempts);
        // console.log('attempts', attempts);
        var sum = attempts.reduce(function(a, b) {
            return a + b;
        });
        // console.log('sum', sum);
        $scope.correct_rate = sum / attempts.length;
        // console.log('correct_rate', $scope.correct_rate);
    };
    $scope.closeWordModal = function() {
        $scope.word_modal.hide();
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
        if (next_word_timeout) {
            $timeout.cancel(next_word_timeout);
        }
        $scope.modal.hide();
        $timeout(function() {
            $scope.forwardNextQuestion();
        }, 500);
    };

    $scope.modal_close_time_left = null;
    var close_countdown = null;
    var next_word_timeout = null;
    $scope.startModalCloseCountdown = function() {
        $scope.modal_close_time_left = Config.get('next_question_delay');
        next_word_timeout = $timeout(function() {
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
        // console.log("CLICKED", $scope.clicked);
        $scope.was_correct = $scope.word.id === answer.id;
        if (Config.get('playsounds') && $scope.was_correct) {
            $scope.playWord(answer);
        }
        $scope.modal.show();
        $scope.startModalCloseCountdown();

        // console.log('$scope.attempts', $scope.attempts);
        // the `0 + bool` turns the bool into 0 or 1
        $scope.attempts[$scope.word.id].push(0 + $scope.was_correct);

        var next_question_delay = Config.get('next_question_delay');
        // console.log('next_question_delay=', next_question_delay);
        if ($scope.was_correct) {
            _temporaryPageTitle('Correct!', next_question_delay);
            $scope.streak++;
            $scope.next_word++;
            // next_timer = $timeout(function() {
            //     setNextQuestion();
            // }, next_question_delay * 1000);
        } else {
            // start over!
            _temporaryPageTitle('Starting over', next_question_delay);
            $scope.streak = 0;
            $scope.next_word = 0;
            $scope.words = shuffle($scope.words);
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
        if (!$scope.word) return;
        return $scope.clicked === alternative && $scope.clicked === $scope.word;
    };

    $scope.isIncorrect = function(alternative) {
        if (!$scope.word) return;
        return $scope.clicked === alternative && $scope.clicked !== $scope.word;
    };

    $scope.showLoading = function() {
        return !$scope.word && !$scope.finished;
    };

    $scope.showCorrect = function() {
        return $scope.clicked && $scope.was_correct;
    };

    $scope.showIncorrect = function() {
        return $scope.clicked && !$scope.was_correct;
    };

})
;
