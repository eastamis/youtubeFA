'use strict';

var namespace = 'youtube-client';

var angular = require('angular');

require('famous-angular');
require('underscore');

var app = require('./components/youtube-client');
require('./components/main/main-ctrl');
require('./components/data/google-api');
require('./components/data/youtube-svc');
require('./components/video-card/video-card-ctrl');
require('./components/video-card/video-card-dir');
require('./components/video-player/video-player-ctrl');

module.exports = app;
