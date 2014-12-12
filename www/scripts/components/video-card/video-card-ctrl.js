'use strict';

angular.module('youtube-client')
  .controller('VideoCardCtrl', function ($scope, $state, $famous) {
    var Transitionable = $famous['famous/transitions/Transitionable'];
    var Easing = $famous['famous/transitions/Easing'];
    var EventHandler = $famous['famous/core/EventHandler'];
    var GenericSync = $famous['famous/inputs/GenericSync'];
    var MouseSync   = $famous["famous/inputs/MouseSync"];
    var TouchSync   = $famous["famous/inputs/TouchSync"];
    var ScrollSync   = $famous["famous/inputs/ScrollSync"];

    GenericSync.register({
      "mouse" : MouseSync,
      "touch" : TouchSync,
      "scroll": ScrollSync
    });

    var TRANSITIONS = {
      SCALE: {
        duration: 333,
        curve: Easing.outQuint
      }
    }

    var cardSync = new GenericSync(["mouse", "touch", "scroll"], {direction: [GenericSync.DIRECTION_X, GenericSync.DIRECTION_Y]});

    cardSync.on('start', function(){
      //shrink cube
      _scale.halt();
      _scale.set([.8, .8, .8], TRANSITIONS.SCALE)
    });

    cardSync.on('update', function(data){
    });

    cardSync.on('end', function(data){
      //grow card back
      _scale.halt();
      _scale.set([1, 1, 1], TRANSITIONS.SCALE)
    });

    $scope.cardHandler = new EventHandler();
    $scope.cardHandler.pipe(cardSync);

    $scope.handlers = [$scope.cardHandler, $scope.scrollHandler];

    var _scale = new Transitionable([1,1,1]);
    $scope.getScale = function(){
      return _scale.get();
    };

    $scope.onClick = function() {
      $state.go('watch', {'id': $scope.videoId});
    };
  });
