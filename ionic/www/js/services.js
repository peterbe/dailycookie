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
    config.playsounds = true;
    config.max_range = 10;  // days

    return {
        get: function(key) {
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
            });
        }
    };
})


.factory('Past', function($localForage) {
    var past = {};

    return {
        // incrementDay: function(group) {
        //     return $localForage.getItem('days-' + group).then(function(days) {
        //         days = days || 0;
        //         $localForage.setItem('days-' + group, days + 1);
        //     });
        // },
        // getDays: function(group) {
        //     return $localForage.getItem('days-' + group);
        // },
        getGroups: function() {
            return $localForage.getItem('groups').then(function(groups) {
                if (!groups) return {};
                return groups;
            });
        },
        getGroup: function(group) {
            return $localForage.getItem('groups').then(function(groups) {
                if (!groups) groups = {};
                if (!groups[group.id]) {
                    groups[group.id] = group;
                    groups[group.id].attempts = [];
                    groups[group.id].days = 0;
                }
                return groups[group.id];
            });
        },
        // saveReappearence: function(group, words) {
        //     return $localForage.setItem('group-' + group, attempts);
        // },
        // rememberGroup: function(group) {
        //     return $locaForage.getItem('groups');
        // },
        rememberAttempts: function(group, attempts) {
            console.log('Remembering GROUP', group, attempts);
            return $localForage.getItem('groups').then(function(groups) {
                if (groups === null) {
                    // we have never remembered any groups before
                    groups = {};
                }
                if (!groups[group.id]) {
                    // we have never remembered this group before
                    groups[group.id] = group;  // maybe a bad idea
                    groups[group.id].attempts = [];
                    groups[group.id].days = 0;
                }
                groups[group.id].attempts.push(attempts);
                groups[group.id].days++;
                return $localForage.setItem('groups', groups);
            });
        },
        // loadAttempts: function(group) {
        //     return $localForage.getItem('group-' + group.id);
        // }
    };
})
;
