'use strict';

angular.module('youtube-client')
  .controller('MainCtrl', function ($scope, $rootScope, $timeout, $window, $famous, googleService, youtube) {
    var Transitionable = $famous['famous/transitions/Transitionable'];
    var Easing = $famous['famous/transitions/Easing'];
    var EventHandler = $famous['famous/core/EventHandler'];

    // buffer for storing video data
    var _buf = {
      'popular': [],
      'subscript': [],
      'search': [],
      currSelect: 'popular'
    };

    // calculate the grid cells
    var CELL_SIZE = { width: 120, height: 90 },
      // content height needs to sub the height of header & footer
      _contentHeight = $window.innerHeight - 120,
      _contentWidth = $window.innerWidth,
      _rows = Math.floor(_contentHeight / CELL_SIZE.height),
      _columns = Math.floor(_contentWidth / CELL_SIZE.width);

    var _arrangePages = function() {
      var type = _buf.currSelect,
        pageTotal = _columns * _rows,
        pages = Math.ceil(_buf[type].length/pageTotal);
      for (var used=0, i=0; i<pages; i+=1) {
        var num = Math.min(pageTotal, (_buf[type].length - used));
        $scope.pages.push({ videos: _buf[type].slice(used, num+used) });
        used += num;
      }
      // reset to 1st page
      //_contentScrollView.goToPage(0);
      $scope.currentPage = 0;

      // update position of page indicator
      $scope.pageIndicAnchor = $scope.pageIndicItemWidth * pages * .5 * -1;
    };

    // monitor current page
    var _contentScrollView = null;
    $timeout(function() {
      _contentScrollView = $famous.find('#content-scroll-view')[0].renderNode;
      _contentScrollView.on('settle', function() {
        $scope.currentPage = _contentScrollView.getCurrentIndex();
        $scope.$apply('currentPage');
      });
    }, 400);

    // query videos
    var _loading = false;
    var _loadVideos = function(type, param){
      if (_loading) { return; } // preview task has not finished yet
      _loading = true;
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
        _loading = false;
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

    //
    // Prepare Google API ---- Begin
    //
    var _loginFlag = false;
    var _loginWorkflow = function() {
      googleService.login().then(function(){
        _loginFlag = true;
        _loadVideos('subscript');
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
        _loadVideos('subscript');
      }, function(){
        alert('Please accept to get your subscription youtube video!');
      });
    };
    //
    // Prepare Google API ---- End
    //

    // famo.us scroller view handler
    $scope.scrollHandler = new EventHandler();

    // Am empty page in beginning
    $scope.pages = [];

    // set size of content area,
    // IT"S IMPORTANT for scrollview pagination
    $scope.contentArea = [_contentWidth, _contentHeight];

    // position of the 1st element of page indicator
    $scope.pageIndicAnchor = 0;
    $scope.pageIndicItemWidth = 20; // item width of page indicator
    $scope.currentPage = 0; // current page

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
      },
      pageIndicOptions: {
        direction: 0 // vertical = 1 (default), horizontal = 0
      }
    };

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
      _loadVideos('search', $scope.search.term);
      $rootScope.searchTerm = $scope.search.term;
    }
    // search videos ---- End

    //
    // tab selector ---- Begin
    //
    var tabWidth = $window.innerWidth / 3;    // dimension
    var FOOTER_HEIGHT = 60;
    $scope.tabSelect = 0;    // current selection
    $scope.tabTitle = 'Recommand';
    // tab members
    $scope.tabs = [
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
    };
    //
    // tab selector ---- End
    //

    // page indicator --- Begin
    $scope.onPageIndicClick = function(index) {
      $scope.currentPage = index;
      _contentScrollView.goToPage(index);
    };
    //
    // page indicator --- End

    // monitor window resize event
    angular.element($window).bind('resize', function(){
      var w = $window.innerWidth / $scope.tabs.length;
      for (var i=0, l=$scope.tabs.length; i<l; i+=1){
        $scope.tabs[i].width = w;
      }
      // adjust grid view
      _contentHeight = $window.innerHeight - 120;
      _contentWidth = $window.innerWidth;
      $scope.contentArea = [_contentWidth, _contentHeight];
      _rows = Math.floor(_contentHeight / CELL_SIZE.height),
      _columns = Math.floor(_contentWidth / CELL_SIZE.width),
      $scope.options.gridLayoutOptions.dimensions = [_columns, _rows];
      // empty all grid items
      $scope.pages.length = 0;
      _arrangePages();
      // apply change
      $scope.$apply();
    });

    // show the most popular videos in the beginning
    _loadVideos('popular', 'today');
  });
