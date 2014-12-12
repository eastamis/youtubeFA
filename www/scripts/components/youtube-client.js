'use strict';

var namespace = 'youtube-client';

var app = angular.module(namespace,
  [ 'ngAnimate', 'ngCookies',
    'ngTouch', 'ngSanitize',
    'ngResource', 'ui.router',
    'famous.angular' ])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'scripts/components/main/main.html',
        controller: 'MainCtrl'
      })
      .state('watch', {
        parent: 'home',
        url: '^/watch/:id?t',
        templateUrl: 'scripts/components/video-player/video-player.html',
        controller: 'VideoPlayerCtrl'
      });

    $urlRouterProvider.otherwise('/');
  })
  .run(function($rootScope) {
    // keep the search term...!
    $rootScope.searchTerm = "Taiwan";
  });

module.exports = app;
