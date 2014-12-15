'use strict';

angular.module('youtube-client')
  .controller('MainCtrl', function ($scope, $rootScope, $window, $famous, googleService, youtube) {
    var Transitionable = $famous['famous/transitions/Transitionable'];
    var Easing = $famous['famous/transitions/Easing'];
    var EventHandler = $famous['famous/core/EventHandler'];

    // famo.us scroller view handler
    $scope.scrollHandler = new EventHandler();

    // buffer for storing video data
    var _buf = {
      'popular': [],
      'subscript': [],
      'search': [],
      currSelect: 'popular'
    };

    // Am empty page in beginning
    $scope.pages = [];

    // set size of content area,
    // IT"S IMPORTANT for scrollview pagination
    $scope.contentArea = [$window.innerWidth, $window.innerHeight-120];

    // calculate the grid cells
    var CELL_SIZE = { width: 120, height: 90 },
      // content height needs to sub the height of header & footer
      _rows = Math.floor($scope.contentArea[1] / CELL_SIZE.height),
      _columns = Math.floor($scope.contentArea[0] / CELL_SIZE.width);
    var _arrangePages = function() {
      var type = _buf.currSelect,
        pageTotal = _columns * _rows;
      for (var used=0, i=0, l=Math.ceil(_buf[type].length/pageTotal); i<l; i+=1) {
        var num = Math.min(pageTotal, (_buf[type].length - used));
        $scope.pages.push({ videos: _buf[type].slice(used, num+used) });
        used += num;
      }
      // reset to 1st page
      //var contentScrollView = $famous.find('#content-scroll-view')[0].renderNode;
      //contentScrollView.goToPage(0);
    };

    // set famo.us viewer options
    $scope.options = {
      horiScrollView: {
        direction: 0,
        //pageStopSpeed: 10,
        //pageSwitchSpeed: 0.5,
        paginated: true
      },
      gridLayoutOptions: {
        dimensions: [_columns, _rows]
      }
    };

    //
    // Prepare Google API ---- Begin
    //
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
    //
    // Prepare Google API ---- End
    //

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
        console.log('total videos: ', _buf[type].length);
        _buf.currSelect = type;
        _arrangePages();
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
      if ($scope.tabSelect === index) { return; }
      $scope.pages.length = 0;
      $scope.tabSelect = index;
      switch(index) {
      default:
      case 0: //Popular
        $scope.tabTitle = 'Recommand';
        _buf.currSelect = 'popular'
        _arrangePages();
        break;
      case 1: //Subscription
        $scope.tabTitle = 'Subscription';
        if (!_loginFlag) {
          _loginWorkflow();
        } else {
          _buf.currSelect = 'subscript'
          _arrangePages();
        }
        break;
      case 2: //Search
        $scope.tabTitle = 'Search';
        if (_buf.search.length === 0) {
          $scope.updateSearch();
        } else {
          _buf.currSelect = 'search'
          _arrangePages();
        }
        break;
      }
    }
    // monitor window resize event
    angular.element($window).bind('resize', function(){
      var w = $window.innerWidth / 3;
      for (var i=0, l=$scope.items.length; i<l; i+=1){
        $scope.items[i].width = w;
      }
      // adjust grid view
      $scope.pages.length = 0;
      _rows = Math.floor(($window.innerHeight-120) / CELL_SIZE.height),
      _columns = Math.floor($window.innerWidth / CELL_SIZE.width),
      $scope.options.gridLayoutOptions.dimensions = [_columns, _rows];
      _arrangePages();
      //
      $scope.$apply('items');
    });
    // tab selector ---- End
  });
