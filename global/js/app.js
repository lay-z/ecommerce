(function() {
    var app = angular.module('store', []);
    var dataObj = {
        'member': 'this be a value for member \'member\'',
    }

    app.controller('ViewController',  function($scope) {
        $scope.data = dataObj;
    })
})()
