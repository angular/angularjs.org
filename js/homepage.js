angular.module('homepage', [])

  .config(function($provide, $locationProvider) {
    var pulseElements = $(),
        pulseColor = {r:0xE6, g:0xF0, b: 0xFF},
        baseColor = {r:0x99, g:0xc2, b: 0xFF},
        pulseDuration = 1000,
        pulseDelay = 15000;

    function hex(number) {
      return ('0' + Number(number).toString(16)).slice(-2);
    }

    jQuery.fn.pulse = function () {
      pulseElements = pulseElements.add(this);
    };
    var lastPulse;

    function tick() {
      var duration = new Date().getTime() - lastPulse,
          index = duration * Math.PI / pulseDuration ,
          level = Math.pow(Math.sin(index), 10),
          color = {
            r: Math.round(pulseColor.r * level + baseColor.r * (1 - level)),
            g: Math.round(pulseColor.g * level + baseColor.g * (1 - level)),
            b: Math.round(pulseColor.b * level + baseColor.b * (1 - level))
          },
          style = '#' + hex(color.r) + hex(color.g) + hex(color.b);

      pulseElements.css('backgroundColor', style);
      if (duration > pulseDuration) {
        setTimeout(function() {
          lastPulse = new Date().getTime();
          tick();
        }, pulseDelay);
      } else {
        setTimeout(tick, 50);
      }
    }

    $provide.value('startPulse', function() {
       setTimeout(function() {
         lastPulse = new Date().getTime();
         tick();
       }, 2000);
    });

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  })

  .value('indent', function(text, spaces) {
    if (!text) return text;
    var lines = text.split(/\r?\n/);
    var prefix = '      '.substr(0, spaces || 0);
    var i;

    // remove any leading blank lines
    while (lines.length && lines[0].match(/^\s*$/)) lines.shift();
    // remove any trailing blank lines
    while (lines.length && lines[lines.length - 1].match(/^\s*$/)) lines.pop();
    var minIndent = 999;
    for (i = 0; i < lines.length; i++) {
      var line = lines[0];
      var indent = line.match(/^\s*/)[0];
      if (indent !== line && indent.length < minIndent) {
        minIndent = indent.length;
      }
    }

    for (i = 0; i < lines.length; i++) {
      lines[i] = prefix + lines[i].substring(minIndent);
    }
    lines.push('');
    return lines.join('\n');
  })

  .value('escape', function(text) {
    return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/"/g, '&quot;');
  })

  .factory('script', function() {

    return {
      angular: '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/' + angular.version.full + '/angular.min.js"></script>\n',
      resource: '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/' + angular.version.full + '/angular-resource.min.js"></script>\n',
      firebase: '<script src="https://cdn.firebase.com/v0/firebase.js"></script>\n    <script src="https://cdn.firebase.com/libs/angularfire/0.5.0/angularfire.min.js"></script>\n'
    };
  })

  .factory('fetchCode', function(indent) {
    return function get(id, spaces) {
      return indent(angular.element(document.getElementById(id)).html(), spaces);
    }
  })

  .directive('code', function() {
    return {restrict: 'E', terminal: true};
  })

  .directive('appRun', function(fetchCode, $templateCache, $browser) {
    return {
      terminal: true,
      link: function(scope, element, attrs) {
        var modules = [];

        modules.push(function($provide, $locationProvider) {
          $provide.value('$templateCache', {
            get: function(key) {
              var value = $templateCache.get(key);
              if (value) {
                value = value.replace(/\#\//mg, '/');
              }
              return value;
            }
          });
          $provide.value('$anchorScroll', angular.noop);
          $provide.value('$browser', $browser);
          $locationProvider.html5Mode(true);
          $locationProvider.hashPrefix('!');
        });
        if (attrs.module) {
          modules.push(attrs.module);
        }

        element.html(fetchCode(attrs.appRun));
        element.bind('click', function(event) {
          if (event.target.attributes.getNamedItem('ng-click')) {
            event.preventDefault();
          }
        });
        element.data('$injector', null);
        angular.bootstrap(element, modules);
      }
    };
  })

  .directive('appSource', function(fetchCode, escape, script) {
    return {
      terminal: true,
      link: function(scope, element, attrs) {
        var tabs = [],
            panes = [],
            annotation = attrs.annotate && angular.fromJson(fetchCode(attrs.annotate)) || {},
            TEMPLATE = {
              'index.html':
                '<!doctype html>\n' +
                '<html ng-app__MODULE__>\n' +
                '  <head>\n' +
                '    ' + script.angular +
               (attrs.resource ? ('    ' + script.resource.replace('></', '>\n    </')) : '') +
               (attrs.firebase ? ('    ' + script.firebase) : '') +
                '__HEAD__' +
                '  </head>\n' +
                '  <body>\n' +
                '__BODY__' +
                '  </body>\n' +
                '</html>'
          };

    element.css('clear', 'both');

        angular.forEach(attrs.appSource.split(' '), function(filename, index) {
          var content;

          tabs.push(
            '<li class="' + (!index ? ' active' : '') + '">' +
              '<a href="#' + id(filename) + '" data-toggle="tab">' + (index ? filename : 'index.html') + '</a>' +
            '</li>');

          if (index == 0) {
            var head = [];

            angular.forEach(attrs.appSource.split(' '), function(tab, index) {
              var filename = tab.split(':')[0],
                  fileType = filename.split(/\./)[1];

              if (index == 0) return;
              if (fileType == 'js') {
                head.push('    <script src="' + filename + '"></script>\n');
              } else if (fileType == 'css') {
                head.push('    <link rel="stylesheet" href="' + filename + '">\n');
              }
            });
            content = TEMPLATE['index.html'];
            content = content.
              replace('__MODULE__', attrs.module ? '="' + attrs.module + '"' : '').
              replace('__HEAD__', head.join('')).
              replace('__BODY__', fetchCode(filename, 4));
          } else {
            content = fetchCode(filename);
          }

          // hack around incorrect tokenization
          content = content.replace('.done-true', 'doneTrue');
          content = prettyPrintOne(escape(content), undefined, true);
          // hack around incorrect tokenization
          content = content.replace('doneTrue', '.done-true');

          var popovers = {},
              counter = 0;

          angular.forEach(annotation[filename], function(text, key) {
            var regexp = new RegExp('(\\W|^)(' + key.replace(/([\W\-])/g, '\\$1') + ')(\\W|$)');

            content = content.replace(regexp, function(_, before, token, after) {
              var token = "__" + (counter++) + "__";
              popovers[token] =
                '<code class="nocode" rel="popover" title="' + escape('<code>' + key + '</code>') +
                '" data-content="' + escape(text) + '">' + escape(key) + '</code>';
              return before + token + after;
            });
          });

          angular.forEach(popovers, function(text, token) {
            content = content.replace(token, text);
          });

          panes.push(
            '<div class="tab-pane' + (!index ? ' active' : '') + '" id="' + id(filename) + '">' +
              '<pre class="prettyprint linenums nocode">' + content +'</pre>' +
            '</div>');
        });

        element.html(
          '<div class="tabbable">' +
            '<ul class="nav nav-tabs">' +
            tabs.join('') +
            '</ul>' +
            '<div class="tab-content">' +
            panes.join('') +
            '</div>' +
            '</div>');
        // element.find('[rel=popover]').popover().pulse();

        function id(id) {
          return id.replace(/\W/g, '-');
        }
      }
    }
  })

  .directive('jsFiddle', function(fetchCode, escape, script) {
    return {
      terminal: true,
      link: function(scope, element, attr) {
        var name = '',
            stylesheet = '<link rel="stylesheet" href="http://twitter.github.com/bootstrap/assets/css/bootstrap.css">\n',
            fields = {
              html: '',
              css: '',
              js: ''
            };

        angular.forEach(attr.jsFiddle.split(' '), function(file, index) {
          var fileType = file.split('.')[1];

          if (fileType == 'html') {
            if (index == 0) {
              fields[fileType] +=
                  '<div ng-app' + (attr.module ? '="' + attr.module + '"' : '') + '>\n' +
                    fetchCode(file, 2);
            } else {
              fields[fileType] += '\n\n\n  <!-- CACHE FILE: ' + file + ' -->\n' +
                  '  <script type="text/ng-template" id="' + file + '">\n' +
                      fetchCode(file, 4) +
                  '  </script>\n';
            }
          } else {
            fields[fileType] += fetchCode(file) + '\n';
          }
        });

        fields.html += '</div>\n';

        element.html(
          '<form class="jsfiddle" method="post" action="http://jsfiddle.net/api/post/library/pure/" target="_blank">' +
            hiddenField('title', 'AngularJS Example: ' + name) +
            hiddenField('css', '</style> <!-- Ugly Hack due to jsFiddle issue: http://goo.gl/BUfGZ --> \n' +
               stylesheet +
               script.angular +
               (attr.resource ? script.resource : '') +
               '<style>\n' +
               fields.css) +
            hiddenField('html', fields.html) +
            hiddenField('js', fields.js) +
            '<button class="btn btn-primary">' +
              '<i class="icon-white icon-pencil"></i> ' +
              'Edit Me' +
            '</button>' +
          '</form>');

        function hiddenField(name, value) {
          return '<input type="hidden" name="' +  name + '" value="' + escape(value) + '">';
        }
      }
    }
  })

  .directive('hint', function() {
    return {
      template: '<em>Hint:</em> hover over ' +
          '<code class="nocode" rel="popover" title="Hover" ' +
          'data-content="Place your mouse over highlighted areas in the code for explanations.">me</code>.'
    }
  })

    .controller('JumbotronCtrl', ['$scope', function($scope) {
      $scope.videos = [
        { img: "https://i.ytimg.com/vi/r1A1VR0ibIQ/hqdefault.jpg",
          title: "Misko Hevery and Brad Green - Keynote - NG-Conf 2014",
          link: "http://www.youtube.com/watch?v=r1A1VR0ibIQ?autoplay=1" },

        { img: "https://i.ytimg.com/vi/_OGGsf1ZXMs/hqdefault.jpg",
          title: "Vojta Jina - Dependency Injection - NG-Conf",
          link: "http://www.youtube.com/watch?v=_OGGsf1ZXMs?autoplay=1" },

        { img: "https://i.ytimg.com/vi/hC0MpgUoui4/hqdefault.jpg",
          title: "Lukas Rubbelke & Matias Niemela - Awesome Interfaces with AngularJS Animations - NG-Conf 2014",
          link: "http://www.youtube.com/watch?v=hC0MpgUoui4?autoplay=1"},

        { img:"https://i.ytimg.com/vi/0V8fQoqQLLA/hqdefault.jpg",
          title: "Jeff Cross - Rapid Prototyping with Angular & Deployd - NGConf",
          link: "http://www.youtube.com/watch?v=0V8fQoqQLLA?autoplay=1"},

        { img:"https://i.ytimg.com/vi/L4FJ_kuO9Rc/hqdefault.jpg",
          title: "Sharon DiOrio - Filters Beyond OrderBy and LimitTo - NG-Conf 2014",
          link:"http://www.youtube.com/watch?v=L4FJ_kuO9Rc?autoplay=1"},

        { img:"https://i.ytimg.com/vi/f62k7b753-Y/hqdefault.jpg",
          title: "Tom Valletta and Gabe Dayley - Angular Weapon Defense - NG-Conf 2014",
          link:"http://www.youtube.com/watch?v=f62k7b753-Y?autoplay=1"},

        { img:"https://i.ytimg.com/vi/JLij19xbefI/hqdefault.jpg",
          title: "John Papa - Progressive Saving - NG-Conf",
          link:"http://www.youtube.com/watch?v=JLij19xbefI?autoplay=1"},

        { img:"https://i.ytimg.com/vi/UMkd0nYmLzY/hqdefault.jpg",
          title:"Dave Smith  - Deep Dive into Custom Directives - NG-Conf 2014",
          link:"http://www.youtube.com/watch?v=UMkd0nYmLzY?autoplay=1"},
      ];
    }])

    .controller('DownloadCtrl', function($scope, $location) {
      $scope.CURRENT_STABLE_VERSION = '1.2.9';
      $scope.CURRENT_UNSTABLE_VERSION = '1.2.9';
      var BASE_CODE_ANGULAR_URL = 'http://code.angularjs.org/';
      var BASE_CDN_URL = 'https://ajax.googleapis.com/ajax/libs/angularjs/';
      var getRelativeUrl = function(branch, build) {
        var version = $scope.getVersion(branch);
        if (build === 'minified') {
          return version + '/angular.min.js';
        } else if (build === 'uncompressed') {
          return version + '/angular.js';
        } else {
          return version + '/angular-' + version + '.zip';
        }
      };

      var currentBranch = false;

      $scope.currentBranch = 'stable';
      $scope.currentBuild = 'minified';

      $scope.selectType = function(type) {
        if (type === false) {
          return;
        }
        $scope.currentBranch = type || 'stable';
        $scope.updateCdnLink();
      };

      $scope.getVersion = function(branch) {
        return branch === 'stable' ? $scope.CURRENT_STABLE_VERSION : $scope.CURRENT_UNSTABLE_VERSION;
      };

      $scope.selectBuild = function(build) {
        $scope.currentBuild = build;
        $scope.updateCdnLink();
      };
      angular.forEach(['#extraInfoBranch', '#extraInfoBuild', '#extraInfoCDN'], function(id) {
        $(id).popover({
          placement: 'left',
          trigger: 'hover',
          delay: {hide: '300'}
        });
      });
      $scope.getPillClass = function(pill, actual) {
        return pill === actual ? 'active' : '';
      };

      window.onkeydown = function (ev) {
        if (ev.keyCode === 27 && currentBranch) {
          $scope.lightbox(false);
          $scope.$apply();
        }
      }

      $scope.lightbox = function(arg) {
        if (typeof arg !== 'undefined') {
          currentBranch = arg;
          $scope.selectType(currentBranch);
        }
        return currentBranch;
      };

      $scope.downloadLink = function() {
        if ($scope.cdnURL && $scope.cdnURL.indexOf('http://') == 0) {
          return $scope.cdnURL;
        } else {
          return BASE_CODE_ANGULAR_URL + getRelativeUrl($scope.currentBranch, $scope.currentBuild);
        }
      };
      $scope.updateCdnLink = function() {
        if ($scope.currentBuild === 'zipped') {
          $scope.cdnURL = 'Unavailable for zip archives';
        } else {
          $scope.cdnURL = BASE_CDN_URL + getRelativeUrl($scope.currentBranch, $scope.currentBuild);
        }
      };
    })

  .run(function($rootScope, startPulse){
    $rootScope.version = angular.version;
    $rootScope.$evalAsync(function(){
      var videoURL;

      $('.video-img').
        bind('click', function() {
          videoURL = $(this).data('video');
        });

      $('#videoModal').
        modal({show:false}).
        on('shown', function(event, a, b, c) {
          var iframe = $(this).find('.modal-body').append('<iframe>').find('iframe');

          iframe.attr({
            width: 1280, height: 720, allowfullscreen: true,
            src: videoURL
          });

          // HACK: The only way I know of tricking YouTube to play HD is to show big and then resize.
          setTimeout(function() {
            iframe.attr({ width: 970, height: 556 });
          }, 2500);
        }).
        on('hidden', function() {
          $(this).find('.modal-body').html('');
        });

      $('[rel=popover]').
        popover().
        pulse();
      startPulse();
    });
  })

angular.module('Group', ['ngResource']);

function GroupCtrl($scope, $resource)
{
  $scope.featuredGroups = $resource('groups/index/getfeatured');
  $scope.featuredGroups.get();

  $scope.recommendedGroups = $resource('groups/index/getrecommended');
  $scope.recommendedGroups.get();
}
