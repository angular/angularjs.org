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

  .value('attrEscape', function(text) {
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
        element.html(fetchCode(attrs.appRun + '-html'));
        element.bind('click', function(event) {
          if (event.target.attributes.getNamedItem('ng-click')) {
            event.preventDefault();
          }
        });
        angular.bootstrap(element);
      }
    };
  })

  .directive('appSource', function(fetchCode, attrEscape) {
    return {
      terminal: true,
      link: function(scope, element, attrs) {
        var id = attrs.appSource,
            html =
              '<!doctype html>\n' +
              '<html ng-app>\n' +
              '  <head>\n' +
              '    <script src="' + window.angularJS.src + '"></script>\n' +
              '    <script>\n' +
                     fetchCode(id + '-script', 6) +
              '    </script>\n' +
              '    <style>\n' +
                     fetchCode(id + '-style', 6) +
              '    </style>\n' +
              '  </head>\n' +
              '  <body>\n' +
                    fetchCode(id + '-html', 4) +
              '  </body>\n' +
              '</html>',
            annotate = angular.fromJson(fetchCode(id + '-annotate'))

        html = html.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
        angular.forEach(annotate, function(text, key) {
          var regexp = new RegExp('(\\W)(' + key.replace(/(\W)/, '\\$1') + ')(\\W)');

          html = html.replace(regexp, function(_, before, token, after) {
            return before +
              '<span class="nocode atn" rel="popover" title="' + attrEscape(key) +
                '" data-content="' + attrEscape(text) + '">' + key + '</span>' + after;
          });
        });

        element.html('<pre class="prettyprint linenums">' + html +'</pre>');
      }
    }
  })

  .directive('jsFiddle', function(fetchCode, attrEscape) {
    return {
      terminal: true,
      link: function(scope, element, attr) {
        var id = attr.jsFiddle,
            script = '<script src="' + window.angularJS.src + '"></script>\n';

        element.html(
          '<form class="jsfiddle" method="post" action="http://jsfiddle.net/api/post/library/pure/" target="_blank">' +
            hiddenField('title', 'AngularJS Example: ' + id) +
            hiddenField('css', fetchCode(id + '-style')) +
            hiddenField('html', script + '<div ng-app>\n' + fetchCode(id + '-html', 2) + '</div>') +
            hiddenField('js', fetchCode(id + '-script')) +
            '<button class="btn btn-primary">' +
            '<i class="icon-white icon-pencil"></i> ' +
            'jsFiddle' +
            '</button>' +
          '</form>');

        function hiddenField(name, value) {
          return '<input type="hidden" name="' +  name + '" value="' + attrEscape(value) + '">';
        }
      }
    }
  })

  .run(function($rootScope){
    $rootScope.$evalAsync(function(){
      prettyPrint();
      $('[rel=tooltip]').tooltip();
      $('[rel=popover]').popover();
    });
  });
