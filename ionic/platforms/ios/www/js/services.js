angular.module('starter.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

    // Some fake testing data
    var friends = [
        { id: 0, name: 'Scruff McGruff' },
        { id: 1, name: 'G.I. Joe' },
        { id: 2, name: 'Miss Frizzle' },
        { id: 3, name: 'Ash Ketchum' }
      ];

      return {
        all: function() {
          return friends;
        },
        get: function(friendId) {
          // Simple index lookup
          return friends[friendId];
        }
      };
})


.factory('Config', function($localForage) {

    var config = {};
    // defaults
    config.batch_size = 5;
    config.next_question_delay = 2;

    return {
        get: function(key) {
            console.log('getting key', key, config[key]);
            return config[key];
        },
        set: function(key, value) {
            throw "not implemented yet";
        },
        load: function() {
            // return a promise that resolves the previous settings
            // have been loaded from localforage
            return $localForage.getItem('settings').then(function(value) {
                for (var key in value) {
                    var new_value = value[key];
                    if (typeof config[key] === typeof 1) {
                        new_value = parseInt(new_value, 10);
                    }
                    config[key] = new_value;
                }
                console.log('config now', config);
            });
        }
    };
})


.factory('Past', function() {
    var past = {};

    return past;
})
;
