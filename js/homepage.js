angular.module('homepage', [])

  .value('indent', function(text, spaces) {
    if (!text) return text;
    var lines = text.split(/\r?\n/);
    var prefix = '      '.substr(0, spaces || 0);
    var i;

    // remove any leading blank lines
    while (lines[0].match(/^\s*$/)) lines.shift();
    // remove any trailing blank lines
    while (lines[lines.length - 1].match(/^\s*$/)) lines.pop();
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

  .factory('fetchCode', function(indent) {
    return function get(id, spaces) {
      return indent(angular.element(document.getElementById(id)).text(), spaces);
    }
  })

  .directive('code', function() {
    return {restrict: 'E', terminal: true};
  })

  .directive('appRun', function(fetchCode) {
    return {
      terminal: true,
      link: function(scope, element, attrs) {
        element.html(fetchCode(attrs.appRun));
        element.bind('click', function(event) {
          if (event.target.attributes.getNamedItem('ng-click')) {
            event.preventDefault();
          }
        });
        angular.bootstrap(element);
      }
    };
  })

  .directive('appSource', function(fetchCode, escape) {
    var TEMPLATE = {
          'index.html':
            '<!doctype html>\n' +
              '<html ng-app>\n' +
              '  <head>\n' +
              '    <script src="' + document.getElementById('angularJS').src + '"></script>\n' +
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

        angular.forEach(attrs.appSource.split(' '), function(tab, index) {
          var parts = tab.split(':'),
              filename = parts[0],
              fileType = filename.split(/\./)[1],
              id = parts[1],
              content = TEMPLATE[filename] || '__BODY__',
              lines = [];

          tabs.push(
            '<li class="' + (!index ? ' active' : '') + '">' +
              '<a href="#pane-' + id + '" data-toggle="tab">' + filename + '</a>' +
            '</li>');

          if (filename == 'index.html') {
            var head = [];

            angular.forEach(attrs.appSource.split(' '), function(tab, index) {
              var filename = tab.split(':')[0],
                  fileType = filename.split(/\./)[1];

              if (filename == 'index.html') return;
              if (fileType == 'js') {
                head.push('    <script src="' + filename + '"></script>\n');
              } else if (fileType == 'css') {
                head.push('    <link rel="stylesheet" href="' + filename + '">\n');
              }
            });
            content = TEMPLATE[filename];
            content = content.
              replace('__HEAD__', head.join('')).
              replace('__BODY__', fetchCode(id, 4));
          } else {
            content = fetchCode(id);
          }

          content = colourCode(content);

          angular.forEach(annotation[filename], function(text, key) {
            var regexp = new RegExp('(\\W)(' + key.replace(/(\W)/g, '\\$1') + ')(\\W)');

            content = content.replace(regexp, function(_, before, token, after) {
              return before +
                '<code class="nocode" rel="popover" title="' + escape('<code>' + key + '</code>') +
                '" data-content="' + escape(text) + '">' + key + '</code>' + after;
            });
          });

          panes.push(
            '<div class="tab-pane' + (!index ? ' active' : '') + '" id="pane-' + id + '">' +
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
      }
    }
  })

  .directive('jsFiddle', function(fetchCode, escape) {
    return {
      terminal: true,
      link: function(scope, element, attr) {
        var id = attr.jsFiddle,
            script = '<script src="' + window.angularJS.src + '"></script>\n';

        element.html(
          '<form class="jsfiddle" method="post" action="http://jsfiddle.net/api/post/library/pure/" target="_blank">' +
            hiddenField('title', 'AngularJS Example: ' + id) +
            hiddenField('css', fetchCode(id + '-style')) +
            hiddenField('html', script + '<div ng-app>\n' + fetchCode(id + '-template', 2) + '</div>') +
            hiddenField('js', fetchCode(id + '-script')) +
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
          'data-content="Hover over code for explanation.">me</code>.'
    }
  })

  .run(function($rootScope){
    $rootScope.$evalAsync(function(){
      $('[rel=tooltip]').tooltip();
      $('[rel=popover]').popover();
    });
  })
