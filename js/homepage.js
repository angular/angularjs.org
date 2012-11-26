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
      angular: '<script src="http://ajax.googleapis.com/ajax/libs/angularjs/' + angular.version.full + '/angular.min.js"></script>\n',
      resource: '<script src="http://ajax.googleapis.com/ajax/libs/angularjs/' + angular.version.full + '/angular-resource.min.js"></script>\n'
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
        element.find('[rel=popover]').popover().pulse();

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

  .factory('createDialog', ["$document","$compile","$rootScope","$controller", "$timeout",
  function ($document, $compile, $rootScope, $controller, $timeout) {
    var defaults = {
      id: null,
      title: 'Default Title',
      backdrop: true,
      success: {label: 'OK', fn: null},
      controller: null, //just like route controller declaration
      backdropClass: "modal-backdrop",
      footerTemplate: null,
      modalClass: "modal"
    };
    var body = $document.find('body');

    return function Dialog(template, options) {
      options = angular.extend({}, defaults, options); //options defined in constructor

      var idAttr = options.id ? ' id="' + options.id + '" ' : '';
      var defaultFooter = '<button class="btn" ng-click="$modalCancel()">Close</button>' +
          '<button class="btn btn-primary" ng-click="$modalSuccess()">{{$modalSuccessLabel}}</button>'
      var footerTemplate = '<div class="modal-footer">' +
          (options.footerTemplate || defaultFooter) +
          '</div>';
      //We don't have the scope we're gonna use yet, so just get a compile function for modal
      var modalEl = angular.element(
          '<div class="' + options.modalClass + ' fade"' + idAttr + '>' +
              '  <div class="modal-header">' +
              '    <button type="button" class="close" ng-click="$modalCancel()">x</button>' +
              '    <h2>{{$title}}</h2>' +
              '  </div>' +
              '  <div class="modal-body" ng-include="\'' + template + '\'"></div>' +
              footerTemplate +
              '</div>');


      var backdropEl = angular.element('<div ng-click="$modalCancel()">');
      backdropEl.addClass(options.backdropClass);
      backdropEl.addClass('fade in');

      var handleEscPressed = function(event) {
        if (event.keyCode === 27) {
          scope.$modalCancel();
        }
      };

      var closeFn = function() {
        body.unbind('keydown', handleEscPressed);
        modalEl.remove();
        if (options.backdrop) {
          backdropEl.remove();
        }
      };

      body.bind('keydown', handleEscPressed);

      var ctrl, locals,
          scope = options.scope || $rootScope.$new();

      scope.$title = options.title;
      scope.$modalCancel = closeFn;
      scope.$modalSuccess = options.success.fn || closeFn;
      scope.$modalSuccessLabel = options.success.label;

      if (options.controller) {
        locals = angular.extend({$scope: scope});
        ctrl = $controller(options.controller, locals);
        modalEl.contents().data('$ngControllerController', ctrl);
      }

      $compile(modalEl)(scope);
      $compile(backdropEl)(scope);
      body.append(modalEl);
      if (options.backdrop) body.append(backdropEl);

      $timeout(function() {
        modalEl.addClass('in');
      }, 200);
    };
  }])

 .directive('popover', function() {
    return function(scope, element, attrs) {
      $(element[0]).popover({
        placement: 'left',
        trigger: 'hover',
        delay: {hide: '300'}
      });

    };
  })

    .controller('DownloadCtrl', function($scope, $location) {
      var CURRENT_STABLE_VERSION = '1.0.2';
      var CURRENT_UNSTABLE_VERSION = '1.1.0';
      var BASE_CODE_ANGULAR_URL = 'http://code.angularjs.org/';
      var BASE_CDN_URL = 'http://ajax.googleapis.com/ajax/libs/angularjs/';
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

      $scope.currentBranch = 'stable';
      $scope.currentBuild = 'minified';

      $scope.selectType = function(type) {
        $scope.currentBranch = type || 'stable';
        $scope.updateCdnLink();
      };

      $scope.getVersion = function(branch) {
        return branch === 'stable' ? CURRENT_STABLE_VERSION : CURRENT_UNSTABLE_VERSION;
      };

      $scope.selectBuild = function(build) {
        $scope.currentBuild = build;
        $scope.updateCdnLink();
      };

      $scope.getPillClass = function(pill, actual) {
        return pill === actual ? 'active' : '';
      };

      $scope.downloadLink = function() {
        if ($scope.cdnURL && $scope.cdnURL.indexOf('http://') === 0) {
          return $scope.cdnURL;
        } else {
          return BASE_CODE_ANGULAR_URL + getRelativeUrl($scope.currentBranch, $scope.currentBuild);
        }
      };
      $scope.updateCdnLink = function() {
        if ($scope.currentBranch === 'unstable' || $scope.currentBuild === 'zipped') {
          $scope.cdnURL = 'Unavailable for Unstable Branch & Zipped Builds';
        } else {
          $scope.cdnURL = BASE_CDN_URL + getRelativeUrl($scope.currentBranch, $scope.currentBuild);
        }
      };

      $scope.updateCdnLink();
    })

  .run(function($rootScope, startPulse, createDialog){
    $rootScope.version = angular.version;
    $rootScope.showDownloadDialog = function() {
      createDialog('partials/download-dialog-body.html', {
        id: 'downloadModal',
        title: 'AngularJS Downloads',
        controller: 'DownloadCtrl',
        footerTemplate: '<a ng-href="http://code.angularjs.org/{{getVersion(currentBranch)}}">Extras</a>\n' +
            '<a href="http://code.angularjs.org/">Previous Versions</a>\n' +
            '<a class="btn btn-primary btn-large" style="float: right; font-size: 20px; padding-left: 20px;" ng-href="{{downloadLink()}}" download><i class="icon-download-alt icon-large"></i> Download</a>'
      });
    };
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
