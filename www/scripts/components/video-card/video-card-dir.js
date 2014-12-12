/**
 * @ngdoc directive
 * @name video-card
 * @module youtube-client
 * @restrict EA
 * @description
 * This directive is used to place an image in a div of specified size,
 * setting overflow hidden and centering the image in the div, accounting
 * for landscape/portrait orientation
 */

angular.module('youtube-client')
  .directive('videoCard', ["$famous", "$famousDecorator", function ($famous, $famousDecorator) {
    return {
      templateUrl: 'scripts/components/video-card/video-card.html',
      scope: true,
      controller: 'VideoCardCtrl',
      restrict: 'EA',
      compile: function(tElement, tAttrs, transclude){

        return {
          pre: function(scope, element, attrs){
            $famousDecorator.ensureIsolate(scope);
          },
          post: function(scope, element, attrs){
            scope.loading = true;
            var imgElem = element[0].querySelector('img');
            imgElem.addEventListener("load", function() {
              scope.loading = false;
              var width = imgElem.width;
              var height = imgElem.height;

              var outputWidth,
                  outputHeight,
                  xOffset,
                  yOffset;

              if(width > height){
                //landscape
                outputHeight = scope.dimensions[1];
                var ratio = outputHeight / height;
                outputWidth = width * ratio;
                xOffset = -(outputWidth - scope.dimensions[0]) / 2;
              }else{
                //portrait or square
                outputWidth = scope.dimensions[0];
                xOffset = 0;
                var ratio =  outputWidth / width;
                outputHeight = height * ratio;
                yOffset = -(outputHeight - scope.dimensions[1]) / 2;
              }

              imgElem.style.width = outputWidth + "px";
              imgElem.style.height = outputHeight + "px";
              imgElem.style.top = yOffset + "px";
              imgElem.style.left = xOffset + "px";
            }, false);

            scope.videoId = scope.$eval(attrs.videoId);
            scope.url = scope.$eval(attrs.url);
            scope.dimensions = scope.$eval(attrs.dimensions);

            var divElem = imgElem.parentNode;
            divElem.style.width = scope.dimensions[0] + 'px';
            divElem.style.height = scope.dimensions[1] + 'px';
          }
        };

      }
    };
  }]);
