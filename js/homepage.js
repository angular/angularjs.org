angular.module('homepage', [])

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

  .factory('angularSrc', function() {

    return 'http://code.angularjs.org/angular-' + angular.version.full + '.js';
  })

  .factory('fetchCode', function(indent) {
    return function get(id, spaces) {
      return indent(angular.element(document.getElementById(id)).text(), spaces);
    }
  })

  .directive('code', function() {
    return {restrict: 'E', terminal: true};
  })

  .directive('appRun', function(fetchCode, $templateCache) {
    return {
      terminal: true,
      link: function(scope, element, attrs) {
        var modules = [];

        modules.push(function($provide) {
          $provide.value('$templateCache', $templateCache);
          $provide.value('$anchorScroll', angular.noop)
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

  .directive('appSource', function(fetchCode, escape, angularSrc) {
    var TEMPLATE = {
          'index.html':
            '<!doctype html>\n' +
              '<html ng-app__MODULE__>\n' +
              '  <head>\n' +
              '    <script src="' + angularSrc + '"></script>\n' +
              '__HEAD__' +
              '  </head>\n' +
              '  <body>\n' +
              '__BODY__' +
              '  </body>\n' +
              '</html>'
        };
    return {
      terminal: true,
      link: function(scope, element, attrs) {
        var tabs = [],
            panes = [],
            annotation = attrs.annotate && angular.fromJson(fetchCode(attrs.annotate)) || {};

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
          content = colourCode(content);
          // hack around incorrect tokenization
          content = content.replace('doneTrue', '.done-true');

          angular.forEach(annotation[filename], function(text, key) {
            var regexp = new RegExp('(\\W|^)(' + key.replace(/([\W\-])/g, '\\$1') + ')(\\W|$)');

            content = content.replace(regexp, function(_, before, token, after) {
              return before +
                '<code class="nocode" rel="popover" title="' + escape('<code>' + key + '</code>') +
                '" data-content="' + escape(text) + '">' + escape(key) + '</code>' + after;
            });
          });

          panes.push(
            '<div class="tab-pane' + (!index ? ' active' : '') + '" id="' + id(filename) + '">' +
              '<pre class="prettyprint linenums nocode">' + content +'</pre>' +
            '</div>');
        });

        scope.$evalAsync(function() {
          // must be delayed boucase of colourCode();
          element.html(
            '<div class="tabbable">' +
              '<ul class="nav nav-tabs">' +
                tabs.join('') +
              '</ul>' +
              '<div class="tab-content">' +
                panes.join('') +
              '</div>' +
            '</div>');
          element.find('[rel=popover]').popover();
        });

        function colourCode(html) {
          // This function is here because the prettyPrint() has no API to color code a chunk of code without
          // adding it to DOM.
          var pre = $('<pre class="prettyprint linenums">');
          pre.text(html);
          $('body').append(pre);
          prettyPrint();
          pre.remove();
          return pre.html();
        }

        function id(id) {
          return id.replace(/\W/g, '-');
        }
      }
    }
  })

  .directive('jsFiddle', function(fetchCode, escape, angularSrc) {
    return {
      terminal: true,
      link: function(scope, element, attr) {
        var name = '',
            stylesheet = '<link rel="stylesheet" href="http://twitter.github.com/bootstrap/assets/css/bootstrap.css">\n',
            script = '<script src="' + angularSrc + '"></script>\n',
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
               script +
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
          'data-content="Place your mouse over highlited areas in the code for explanations.">me</code>.'
    }
  })

  .run(function($rootScope){
    $rootScope.version = angular.version;
    $rootScope.$evalAsync(function(){
      var videoModal = $('#videoModal');

      videoModal.modal({show:false});
      videoModal.on('shown', function() {
        videoModal.find('.modal-body').
          html('<iframe width="970" height="576" src="http://www.youtube.com/embed/WuiHuZq_cg4?hd=1&autoplay=1" frameborder="0" allowfullscreen></iframe>')
      });
      videoModal.on('hidden', function() {
        videoModal.find('.modal-body').html('');
      });

      $('[rel=popover]').popover();
    });
  })
