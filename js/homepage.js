angular.module('homepage', ['ngAnimate', 'ui.bootstrap', 'download-data'])

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
    return text.replace(/\&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  })

  .factory('script', function() {

    return {
      angular: '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/' + angular.version.full + '/angular.min.js"></script>\n',
      resource: '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/' + angular.version.full + '/angular-resource.min.js"></script>\n',
      route: '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/' + angular.version.full + '/angular-route.min.js"></script>\n',
      firebase: '<script src="https://cdn.firebase.com/js/client/2.0.4/firebase.js"></script>\n    <script src="https://cdn.firebase.com/libs/angularfire/0.9.0/angularfire.min.js"></script>\n'
    };
  })

  .factory('fetchCode', function(indent) {
    return function get(id, spaces) {
      return indent(angular.element(document.getElementById(id)).html(), spaces);
    };
  })

  .factory('formPostData', ['$document', function($document) {
    return function(url, newWindow, fields) {
      /**
       * If the form posts to target="_blank", pop-up blockers can cause it not to work.
       * If a user choses to bypass pop-up blocker one time and click the link, they will arrive at
       * a new default plnkr, not a plnkr with the desired template.  Given this undesired behavior,
       * some may still want to open the plnk in a new window by opting-in via ctrl+click.  The
       * newWindow param allows for this possibility.
       */
      var target = newWindow ? '_blank' : '_self';
      var form = angular.element('<form style="display: none;" method="post" action="' + url + '" target="' + target + '"></form>');
      angular.forEach(fields, function(value, name) {
        var input = angular.element('<input type="hidden" name="' +  name + '">');
        input.attr('value', value);
        form.append(input);
      });
      $document.find('body').append(form);
      form[0].submit();
      form.remove();
    };
  }])

  .factory('templateBuilder', function(script) {
    var COPYRIGHT = 'Copyright ' + (new Date()).getFullYear() + ' Google Inc. All Rights Reserved.\n'
     + 'Use of this source code is governed by an MIT-style license that\n'
     + 'can be found in the LICENSE file at http://angular.io/license';
    var COPYRIGHT_JS_CSS = '\n\n/*\n' + COPYRIGHT + '\n*/';
    var COPYRIGHT_HTML = '\n\n<!-- \n' + COPYRIGHT + '\n-->';

    return {
      createLocalDependencies: function(files) {
        var head = [];

        angular.forEach(files.split(' '), function(file, index) {
          var filename = file.split(':')[0],
              fileType = filename.split(/\./)[1];

          if (index === 0) return;
          if (fileType == 'js') {
            head.push('    <script src="' + filename + '"></script>\n');
          } else if (fileType == 'css') {
            head.push('    <link rel="stylesheet" href="' + filename + '">\n');
          }
        });

        return head;
      },
      getIndexTemplate: function(deps) {
        return '<!doctype html>\n' +
            '<html ng-app__MODULE__>\n' +
            '  <head>\n' +
            '    ' + script.angular +
           (deps.resource ? ('    ' + script.resource.replace('></', '>\n    </')) : '') +
           (deps.route ? ('    ' + script.route.replace('></', '>\n   </')) : '') +
           (deps.firebase ? ('    ' + script.firebase) : '') +
            '__HEAD__' +
            '  </head>\n' +
            '  <body>\n' +
            '__BODY__' +
            '  </body>\n' +
            '</html>';
      },
      getCopyright: function(filename) {
        switch (filename.substr(filename.lastIndexOf('.'))) {
          case '.html':
            return COPYRIGHT_HTML;
          case '.js':
          case '.css':
            return COPYRIGHT_JS_CSS;
          case '.md':
            return COPYRIGHT;
        }
        return '';
      }
    };
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
            },
            put: function(key, value) {
              // noop, we don't need the cache for anything in examples
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

  .directive('appSource', function(fetchCode, escape, $compile, $timeout, templateBuilder, $sce) {
    return {
      terminal: true,
      scope: {},
      link: function(scope, element, attrs) {
        var tabs = [],
            annotation = attrs.annotate && angular.fromJson(fetchCode(attrs.annotate)) || {};

        element.css('clear', 'both');

        angular.forEach(attrs.appSource.split(' '), function(filename, index) {
          var content;

          if (index === 0) {
            var head = templateBuilder.createLocalDependencies(attrs.appSource);

            content = templateBuilder.getIndexTemplate(attrs);
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
            counter++;

            text = text.replace('{{', '&#123;&#123;').replace('}}', '&#125;&#125;');

            var regexp = new RegExp('(\\W|^)(' + key.replace(/([\W\-])/g, '\\$1') + ')(\\W|$)');

            scope['popover' + index + counter] = $sce.trustAsHtml(text);

            content = content.replace(regexp, function(_, before, token, after) {
              token = '__' + counter + '__';
              popovers[token] =
                '<span ' +
                    'class="nocode code-annotation" ' +
                    'popover-append-to-body="true" ' +
                    'popover-trigger="mouseenter" ' +
                    'popover-title="' + escape(key) + '" ' +
                    'uib-popover-html="popover' + index + counter + '">' +
                  '<code>' + escape(key) + '</code>' +
                '</span>';
              return before + token + after;
            });
          });

          angular.forEach(popovers, function(text, token) {
            content = content.replace(token, text);
          });

          tabs.push(
            '<uib-tab heading="' + (index ? filename : 'index.html')  + '">\n' +
            '  <pre class="prettyprint linenums nocode"><code>' + content +'</code></pre>\n' +
            '</uib-tab>\n'
          );
        });

        element.html(
          '<uib-tabset>' +
            tabs.join('') +
          '</uib-tabset>');

        // Compile up the HTML to get the directives to kick-in
        $compile(element.children())(scope);
        $timeout(function() {
          var annotationElements = element.find('span[uib-popover-html]');
          $compile(annotationElements)(scope);
        }, 0);
      }
    };
  })

  .directive('plnkr', function(fetchCode, formPostData, script, templateBuilder) {
    return {
      template: '<button ng-click="plnkr.open($event)" class="btn btn-primary">' +
                '<i class="icon-white icon-pencil"></i> ' +
                'Edit Me' +
              '</button>',
      scope: {},
      bindToController: {
        'files': '@plnkr',
        'module': '@?module',
        'resource': '@?',
        'route': '@?',
        'firebase': '@?',
      },
      controllerAs: 'plnkr',
      controller: function() {

        this.$onInit = function() {
          var ctrl = this;

          var name = '',
            bootstrapStylesheet = 'http://netdna.bootstrapcdn.com/twitter-bootstrap/2.0.4/css/bootstrap-combined.min.css',
            plnkrFiles = [];

          angular.forEach(ctrl.files.split(' '), function(filename, index) {
            var content;

            if (index === 0) {
              var head = templateBuilder.createLocalDependencies(ctrl.files);

              head.push('    <link rel="stylesheet" href="' + bootstrapStylesheet + '">\n');
              content = templateBuilder.getIndexTemplate({resource: ctrl.resource, route: ctrl.route, firebase: ctrl.firebase});
              content = content.
                replace('__MODULE__', ctrl.module ? '="' + ctrl.module + '"' : '').
                replace('__HEAD__', head.join('')).
                replace('__BODY__', fetchCode(filename, 4));
            } else {
              content = fetchCode(filename);
            }

            content += templateBuilder.getCopyright(filename);

            plnkrFiles.push({
              name: index === 0 ? 'index.html' : filename, // plnkr expects an index.html
              content: content
            });
          });

          ctrl.open = function(clickEvent) {

            var newWindow = clickEvent.ctrlKey || clickEvent.metaKey;

            var postData = {
              'tags[0]': "angularjs",
              'tags[1]': "example",
              'private': true
            };

            angular.forEach(plnkrFiles, function(file) {
              postData['files[' + file.name + ']'] = file.content;
            });

            postData.description = 'AngularJS Example: ' + name;

            formPostData('http://plnkr.co/edit/?p=preview', newWindow, postData);
          };
        };
      }
    };
  })

  .directive('hint', function() {
    return {
      template:
        '<em>Hint:</em> ' +
          'hover over ' +
          '<code ' +
              'class="nocode code-annotation" ' +
              'popover-append-to-body="true" ' +
              'popover-trigger="mouseenter" ' +
              'popover-title="Hover" ' +
              'uib-popover="Place your mouse over highlighted areas in the code for explanations.">' +
            'me' +
          '</code>.'
    };
  })

  .controller('AppController', function($scope, $uibModal, BRANCHES) {
    $scope.BRANCHES = BRANCHES;

    $scope.showDownloadModal = function() {
      $uibModal.open({
        templateUrl: 'partials/download-modal.html',
        windowClass: 'download-modal'
      });
    };

    $scope.showVideo = function(videoUrl) {
      $uibModal.open({
        templateUrl: 'partials/video-modal.html',
        windowClass: 'video-modal',
        controller: 'VideoController',
        resolve: {
          videoUrl: function() { return videoUrl; }
        }
      });
    };

  })

  .controller('DownloadController', function($scope, $sce, BRANCHES, BUILDS, DOWNLOAD_INFO) {

    function getRelativeUrl(branch, build) {
      switch (build.name) {
        case 'Minified':
          return branch.version + '/angular.min.js';
        case 'Uncompressed':
          return branch.version + '/angular.js';
        case 'Zip':
          return branch.version + '/angular-' + branch.version + '.zip';
      }
    }

    $scope.BRANCHES = BRANCHES;
    $scope.BUILDS = BUILDS;
    $scope.DOWNLOAD_INFO_TRUSTED = {
      branchesInfo: $sce.trustAsHtml(DOWNLOAD_INFO.branchesInfo),
      buildsInfo: $sce.trustAsHtml(DOWNLOAD_INFO.buildsInfo),
      bowerInfo: $sce.trustAsHtml(DOWNLOAD_INFO.bowerInfo),
      cdnInfo: $sce.trustAsHtml(DOWNLOAD_INFO.cdnInfo)
    };

    $scope.currentBranch = $scope.BRANCHES[0];
    $scope.currentBuild = $scope.BUILDS[0];

    $scope.setBranch = function(branch) {
      $scope.currentBranch = branch;
    };

    $scope.setBuild = function(build) {
      $scope.currentBuild = build;
    };

    var BASE_CDN_URL = 'https://ajax.googleapis.com/ajax/libs/angularjs/';
    $scope.cdnUrl = function() {
      if ($scope.currentBuild.name !== 'Zip') {
        return BASE_CDN_URL + getRelativeUrl($scope.currentBranch, $scope.currentBuild);
      }
    };


    var BASE_CODE_ANGULAR_URL = 'http://code.angularjs.org/';
    $scope.downloadLink = function() {
      return $scope.cdnUrl() || BASE_CODE_ANGULAR_URL + getRelativeUrl($scope.currentBranch, $scope.currentBuild);
    };


  })

.controller('VideoController', function($scope, $timeout, $sce, videoUrl) {

  // HACK: Trick YouTube to play HD by showing big and then resizing after 2500ms.

  $scope.video = {
    width: 1280,
    height: 720,
    allowfullscreen: true,
    src: $sce.trustAsResourceUrl(videoUrl)
  };

  $timeout(function() {
    $scope.video.width = 970;
    $scope.video.height = 556;
  }, 2500);

})

.run(function($rootScope, startPulse){
  $rootScope.version = angular.version;

  //   $('[rel=popover]').
  //     popover().
  //     pulse();
  //   startPulse();
  // });

});
