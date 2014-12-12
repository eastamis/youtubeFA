'use strict';

angular.module('youtube-client')
.service('googleService', ['$http', '$q', function ($http, $q) {
  var clientId = '379066002110-33dp6i74p4iq4k3tbsrkgsd3rste9dfa.apps.googleusercontent.com',
    scopes = [ 'https://www.googleapis.com/auth/youtube' ],
    apiLoaded = false,
    deferred = $q.defer();

  this.loadApi = function() {
    if (document.getElementById('googleapi')) { return; }
    var js = document.createElement('script'),
      self = this;
    js.id = 'googleapi';
    js.async = true;
    js.src = 'https://apis.google.com/js/client.js';
    js.addEventListener('load', function(){
      apiLoaded = true;
      self.handleClientLoad();
    }, false);
    document.getElementsByTagName('head')[0].appendChild(js);
  };

  this.login = function() {
    if (!apiLoaded) {
      this.loadApi();
      return deferred.promise;
    }

    gapi.auth.authorize({
      client_id: clientId,
      scope: scopes,
      immediate: true,
    }, this.handleAuthResult);

    return deferred.promise;
  };

  this.handleClientLoad = function() {
    var self = this;
    if (gapi.auth && gapi.auth.init) {
      gapi.auth.init(function(){
        self.checkAuth();
      });
    } else {
      window.setTimeout(function(){
        self.handleClientLoad();
      }, 100);
    }
  };

  this.checkAuth = function() {
    gapi.auth.authorize({
      client_id: clientId,
      scope: scopes,
      immediate: true,
    }, this.handleAuthResult);
  };

  this.handleAuthResult = function(authResult) {
    if (authResult && !authResult.error) {
      var authInfo = authResult;
      gapi.client.load('youtube', 'v3', function(){
        deferred.resolve(authInfo);
      });
    } else {
      deferred.reject('error');
    }
  };

  this.handleAuthClick = function(event) {
    gapi.auth.authorize({
      client_id: clientId,
      scope: scopes,
      immediate: false,
    }, this.handleAuthResult);
    // reset defer...!
    deferred = $q.defer();
    return deferred.promise;
  };

}]);
