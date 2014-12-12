'use strict';

angular.module('youtube-client')
  .controller('VideoPlayerCtrl', function ($scope, $state, $stateParams, $famous, youtube) {
    var Transitionable = $famous['famous/transitions/Transitionable'];
    var Easing = $famous['famous/transitions/Easing'];

    $scope.scale = new Transitionable([.001, .001, .001]);
    $scope.opacity = new Transitionable(0);

    var promise = youtube.getVideoById($stateParams.id);
    promise.success(function(data){
      var video = youtube.parseVideo(data.entry);
      $scope.title = video.title;
      $scope.url = video.embedUrl;
    });
    promise.error(function(){
      console.log("API ERROR!", arguments);
    });

    $scope.animEnter = function($done){
      // NOTE: fa-animate-enter needs to connected to ng-repeat...!
      $scope.scale.set([1, 1, 1], {duration: 1000, curve: Easing.outElastic});
      $scope.opacity.set(1, {duration: 1250, curve: "linear"}, $done);
    };

    $scope.onClick = function(){
      $state.go('home');
    };
  })
  .filter('trustAsResourceUrl', ['$sce', function($sce) {
    return function(val) {
      return $sce.trustAsResourceUrl(val);
    };
  }]);
