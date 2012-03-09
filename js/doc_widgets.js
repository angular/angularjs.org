angular.module('homepage', []).
  directive('docExample', function() {

    var angularJsUrl;
    var scripts = document.getElementsByTagName("script");
    var angularJsRegex = /^(|.*\/)angular(-.*?)?(\.min)?.js(\?[^#]*)?(#(.*))?$/;
    for(var j = 0; j < scripts.length; j++) {
      var src = scripts[j].src;
      if (src && src.match(angularJsRegex)) {
        angularJsUrl = src.replace('docs.angularjs.org', 'code.angularjs.org');
        continue;
      }
    }


    var HTML_TEMPLATE =
      '<!doctype html>\n' +
        '<html ng-app>\n' +
        ' <script src="' + angularJsUrl + '"></script>\n' +
        ' <body>\n' +
        '_HTML_SOURCE_\n' +
        ' </body>\n' +
        '</html>';


    return {
      restrict: 'C',
      priority: 1000,
      compile: function(element) {

        var exampleSrc = indent(element.text());
        var ul = angular.element('<ul class="doc-example">');
        var example = angular.element('<li class="doc-example-live">').html(exampleSrc)

        element.replaceWith(ul);
        ul.append('<li class="doc-example-heading"><h3>Live Preview</h3></li>');
        ul.append(example);
        ul.append('<li class="doc-example-heading"><h3>Suorce</h3></li>');
        ul.append(
          angular.element('<li class="doc-example-source" ng-non-bindable>').append(
            angular.element('<pre  class="brush: js">').text(HTML_TEMPLATE.replace('_HTML_SOURCE_', exampleSrc))));

        var script = (exampleSrc.match(/<script[^\>]*>([\s\S]*)<\/script>/) || [])[1] || '';
        try {
          window.eval(script);
        } catch (e) {
          alert(e);
        }
      }
    };

    ///////////////////////////////
    ///////////////////////////////

    function indent(text) {
      if (!text) return text;
      var lines = text.split(/\r?\n|\r/);
      // remove any leading blank lines
      while (lines[0].match(/^\s*$/)) lines.shift();
      // remove any trailing blank lines
      while (lines[lines.length - 1].match(/^\s*$/)) lines.pop();
      var minIndent = 999;
      for ( var i = 0; i < lines.length; i++) {
        var line = lines[0];
        var indent = line.match(/^\s*/)[0];
        if (indent !== line && indent.length < minIndent) {
          minIndent = indent.length;
        }
      }

      for ( var i = 0; i < lines.length; i++) {
        lines[i] = '  ' + lines[i].substring(minIndent);
      }
      return lines.join('\n');
    };
  });
