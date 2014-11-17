angular.module('cms').controller('AddController',
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
