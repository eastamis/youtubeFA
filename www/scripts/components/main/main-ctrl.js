'use strict';

angular.module('youtube-client')
  .controller('MainCtrl', function ($scope, $rootScope, $window, $famous, googleService, youtube) {
    var Transitionable = $famous['famous/transitions/Transitionable'];
    var Easing = $famous['famous/transitions/Easing'];
    var EventHandler = $famous['famous/core/EventHandler'];

    $scope.scrollHandler = new EventHandler();

    // buffer for storing video data
    var _buf = {
      'popular': [],
      'subscript': [],
      'search': []
    };

    // Prepare Google API ---- Begin
    // whether google oauth ready?
    var _loginFlag = false;
    var _loginWorkflow = function() {
      googleService.login().then(function(){
        _loginFlag = true;
        $scope.loadVideos('subscript');
      }, function(){
        $scope.authTranslate.set([0, 0, 100], {duration: 1444, curve: 'linear'});
        $scope.needAuth = true;
      });
    };

    // why $window.innerHeight*4, avoid it's appear after screen rotation
    // TODO: hide the auth dialog...!
    $scope.authTranslate = new Transitionable([0, $window.innerHeight*4, 100]);
    $scope.needAuth = false; // set true if need to get google oauth token
    $scope.onAuthClick = function() {
      googleService.handleAuthClick().then(function(){
        $scope.authTranslate.set([0, $window.innerHeight*4, 100], {duration: 444, curve: 'linear'});
        $scope.needAuth = false;
        _loginFlag = true;
        $scope.loadVideos('subscript');
      }, function(){
        alert('Please accept to get your subscription youtube video!');
      });
    };
    // Prepare Google API ---- End

    $scope.loading = false;
    $scope.loadVideos = function(type, param){
      $scope.loading = true;
      var promise;
      switch (type) {
      case 'search':
        promise = youtube.getVideoSearchList(param);
        break;
      case 'subscript':
        promise = youtube.getVideoSubscription();
        break;
      case 'popular':
      default:
        promise = youtube.getVideoMostPopularList(param || 'today');
        break;
      }
      promise.success(function(data){
        $scope.loading = false;
        _buf[type] = _.map(data.feed.entry, function(video){
          var scale = new Transitionable([.001, .001, .001]);
          var opacity = new Transitionable(0);
          return _.extend(video, {
            vid: youtube.getVideoId(video),
            thumbnail: youtube.getThumbnailUrl(video),
            scale: scale,
            opacity: opacity
          });
        });
        $scope.videos = _buf[type];
      });
      promise.error(function(){
        console.log("API ERROR!", arguments);
      })
    };

    // show the most popular videos in beginning
    $scope.loadVideos('popular', 'today');

    // animation while add new video
    $scope.animEnter = function(video, $done){
      video.scale.set([1, 1, 1], {duration: 1000, curve: Easing.outElastic});
      video.opacity.set(1, {duration: 1250, curve: "linear"}, $done);
    };

    // search videos ---- Begin
    $scope.search = {
      term: $rootScope.searchTerm
    }
    $scope.updateSearch = function(){
      if (!$scope.loading) {
        $scope.loadVideos('search', $scope.search.term);
        $rootScope.searchTerm = $scope.search.term;
      }
    }
    // search videos ---- End

    // tab selector ---- Begin
    var tabWidth = $window.innerWidth / 3;    // dimension
    var FOOTER_HEIGHT = 60;
    $scope.tabSelect = 0;    // current selection
    $scope.tabTitle = 'Recommand';
    // tab members
    $scope.items = [
      { id: 'tab0', name: 'Popular', width: tabWidth, height: FOOTER_HEIGHT },
      { id: 'tab1', name: 'Subscription', width: tabWidth, height: FOOTER_HEIGHT },
      { id: 'tab2', name: 'Search', width: tabWidth, height: FOOTER_HEIGHT }
    ];
    // set a horizontal scroller
    $scope.tabOptions = {
      scrollView: {
        direction: 0
      }
    };
    // tab click handler
    $scope.onTabClick = function(index){
      var buffer;
      $scope.tabSelect = index;
      switch(index) {
      default:
      case 0: //Popular
        $scope.tabTitle = 'Recommand';
        buffer = _buf.popular;
        break;
      case 1: //Subscription
        $scope.tabTitle = 'Subscription';
        if (!_loginFlag) {
          _loginWorkflow();
        } else {
          buffer = _buf.subscript;
        }
        break;
      case 2: //Search
        $scope.tabTitle = 'Search';
        buffer = _buf.search;
        if (buffer.length === 0) {
          $scope.updateSearch();
        }
        break;
      }
      $scope.videos = buffer;
    }
    // monitor window resize event
    angular.element($window).bind('resize', function(){
      var w = $window.innerWidth / 3;
      for (var i=0, l=$scope.items.length; i<l; i+=1){
        $scope.items[i].width = w;
      }
      $scope.$apply('items');
    });
    // tab selector ---- End
  });
