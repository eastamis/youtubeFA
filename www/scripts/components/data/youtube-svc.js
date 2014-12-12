'use strict';

angular.module('youtube-client')
  .factory('youtube', function ($http, $q) {
    var PER_PAGE = 40;
    var _getBaseUrl = function(){
      return "https://gdata.youtube.com/feeds/api/";
    };
    var _getVideoEmbedUrl = function(id) {
      return "https://www.youtube.com/embed/" + id + "?rel=0" +
        "&showsearch=0&autohide=2&autoplay=1&color1=FFFFFF" +
        "&color2=FFFFFF&controls=1&fs=1&loop=0&hd=1&showinfo=0" +
        "&color=red&theme=light";
    };
    var _getVideoId = function(videoInfo) {
      if (videoInfo.contentDetails !== undefined) { // Subscription video!
        return videoInfo.contentDetails.upload.videoId;
      } else {
        var $t = videoInfo.id.$t;
        var separator = ($t.search('/') !== -1) ? '/' : ':';
        var a = $t.split(separator);
        return a[a.length-1];
      }
    };

    // current page status...!
    var _currPopularPage = 1;
    var _currSearchPage = 1;
    var _subsNextPage = null;

    // get Subscription Videos ---- Begin
    var SSDefer = function(promise) {
      var _okCB = function(){};
      var _errorCB = function(){};
      // worse try...!
      promise.then(function(data) {
        _okCB(data);
      }, function() {
        _errorCB();
      });
      return {
        success: function(callback){
          _okCB = callback;
        },
        error: function(callback){
          _errorCB = callback;
        }
      };
    };
    var ssArray = [];   // subscription cache...
    var deferred = $q.defer();
    var ssDefer = new SSDefer(deferred.promise);

    var _querySubscriptions = function(pageToken) {
      var options = {
        part: 'snippet',
        maxResults: 10,
        mine: true
      };
      if (pageToken) { options.pageToken = pageToken; }
      var request = gapi.client.youtube.subscriptions.list(options);
      request.execute(function(response) {
        for (var i=0, l=response.result.items.length; i<l; i+=1) {
          var item = response.result.items[i];
          // keep the subscription...
          ssArray.push(item);
          ssArray[i].channels = [];
          _queryChannels(i, ssArray[i].snippet.resourceId.channelId);
        }
        if (response.result.nextPageToken !== undefined) {
          //_querySubscriptions(response.result.nextPageToken);
          _subsNextPage = response.result.nextPageToken; // not used yet!
        }
      });
    };
    var _queryChannels = function(sidx, channelId, pageToken) {
      var options = {
        id: channelId,
        part: 'snippet',
        maxResults: 10
      };
      if (pageToken) { options.pageToken = pageToken; }
      var request = gapi.client.youtube.channels.list(options);
      request.execute(function(response) {
        var j = ssArray[sidx].channels.length;
        for (var i=0, l=response.result.items.length; i<l; i+=1) {
          // keep the channel....!
          ssArray[sidx].channels.push(response.result.items[i]);
          ssArray[sidx].channels[i+j].videos = [];
        }
        //if (response.result.nextPageToken !== undefined) {
        //  _queryChannels(sidx, channelId, response.result.nextPageToken);
        //} else {
          // there's no more channels, query videos...
          _queryVideos(sidx);
        //}
      });
    };
    var _queryVideos = function(sidx) {
      for (var i=0, l=ssArray[sidx].channels.length; i<l; i+=1) {
        var channel = ssArray[sidx].channels[i];
        _queryActivities(sidx, i, channel.id);
      }
    };
    var _queryActivities = function(sidx, cidx, channelId, pageToken) {
      var options = {
        channelId: channelId,
        part: 'snippet,contentDetails',
        maxResults: 10
      };
      if (pageToken) { options.pageToken = pageToken; }
      var request = gapi.client.youtube.activities.list(options);
      request.execute(function(response) {
        var j = ssArray[sidx].channels[cidx].videos.length;
        for (var i=0, k=0, l=response.result.items.length; i<l; i+=1) {
          var item = response.result.items[i];
          // skip video not belong "upload" activity...!
          if (item.snippet.type !== 'upload') continue;
          // keep the video....!
          ssArray[sidx].channels[cidx].videos.push(item);
          k += 1;
        }
        //if (response.result.nextPageToken !== undefined) { // end of the pageToken
        //  _queryActivities(sidx, cidx, channelId, response.result.nextPageToken);
        //} else {
          // check whether the last query...!
          if (sidx === ssArray.length-1 && cidx === ssArray[sidx].channels.length-1) {
            _querySubscriptionsDone();
          }
        //}
      });
    };
    var _querySubscriptionsDone = function() {
      var videos = [];
      for (var i=0, l=ssArray.length; i<l; i+=1) {
        var channels = ssArray[i].channels;
        for (var n=0, m=channels.length; n<m; n+=1) {
          videos = videos.concat(channels[n].videos);
        }
      }
      //console.log('subscription videos: ', videos.length);
      deferred.resolve({ feed: { entry: videos }});
    }
    // get Subscription Videos ---- End


    return {
      //get most popular videos
      getVideoMostPopularList: function(param){
        var url = _getBaseUrl() + 'standardfeeds/most_popular?time=' + param +
          "&alt=json&max-results=" + PER_PAGE + "&start-index=" + _currPopularPage;
        _currPopularPage += 1;
        return $http.get(url);
      },
      //gets a list of videos by keyword
      getVideoSearchList: function(searchTerm){
        var url = _getBaseUrl() + "videos?q=" + searchTerm +
          "&alt=json&max-results=" + PER_PAGE + "&start-index=" + _currSearchPage;
        _currSearchPage += 1;
        return $http.get(url);
      },
      //
      getVideoSubscription: function(){
        _querySubscriptions();
        return ssDefer;
      },
      getVideoId: function(videoInfo){
        return _getVideoId(videoInfo);
      },
      getThumbnailUrl: function(videoInfo){
        var url;
        if (videoInfo.snippet !== undefined) { // Subscription video!
          url = (videoInfo.snippet.thumbnails.high !== undefined) ?
            videoInfo.snippet.thumbnails.high.url :
            videoInfo.snippet.thumbnails.default.url;
        } else {
          var thumbnail = videoInfo.media$group.media$thumbnail;
          if (angular.isArray(thumbnail) && thumbnail.length) {
            url = thumbnail[0].url;
          } else {
            url = 'https://i.ytimg.com/vi/' + _getVideoId(videoInfo) + '/default.jpg';
          }
        }
        return url;
      },
      getVideoById: function(id){
        var url = _getBaseUrl() + "videos/" + id+ "?v=2&alt=json";
        return $http.get(url);
        //return 'https://www.youtube.com/watch?v=' + id;
      },
      parseVideo: function(videoInfo) {
        var id = _getVideoId(videoInfo);
        return {
          id: id,
          title: videoInfo.title.$t,
          url: 'https://www.youtube.com/watch?v=' + id,
          embedUrl: _getVideoEmbedUrl(id)
        };
      }
    };
  });
