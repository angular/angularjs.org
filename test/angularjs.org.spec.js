describe('Angularjs.org', function () {
  var protractor = require('protractor')
    , tractor = protractor.getInstance()
    , protractorConfig = require('../protractorConf.js')
    , webdriver = require('selenium-webdriver');

  describe('App', function () {
    beforeEach(function () {
      tractor.get('');
    });


    it('should have the correct version of angularjs loaded', function() {
      //This only runs if an environment variable tells us to check
      if (process.env.CHECK_SCRIPT_TAG !== 'true') return;
      var scriptTag = tractor.findElement(protractor.By.css('script#angularScript'));
      expect(scriptTag.getAttribute('src')).
          toContain(process.env.ANGULAR_VERSION);
    })


    it('should load the web page', function () {
      var body = tractor.findElement(protractor.By.css('body'));
      expect(body.getAttribute('ng-controller')).toEqual('AppCtrl');
    });


    describe('Download', function () {
      var stableVersion, cdnInput,
          downloadVersions = process.env.ANGULAR_DOWNLOAD_VERSIONS.split(' ');

      beforeEach(function () {
        var downloadBtn = tractor.findElement(protractor.By.css('.hero-unit .btn-primary')), done;
        downloadBtn.click();
        tractor.driver.sleep(500);
        cdnInput = tractor.findElement(protractor.By.css('#cdnURL'));
        cdnInput.getAttribute('value')
        cdnInput.getText().then(function (text) {
          stableVersion = text.toString().split('/').splice(-2,1)[0];
        });
      });

      it('should open a modal prompting for download configuration', function () {
        var downloadModal = tractor.findElement(protractor.By.css('.download-modal'))
        expect(downloadModal.getCssValue('display')).toEqual('block');
      });


      it('should change the CDN url based on user selection of stable or unstable', function () {
        var okay;
        var unstableButton = tractor.findElement(protractor.By.css(".branch-btns button:nth-child(1)"));
        unstableButton.click();
        cdnInput.getAttribute('value').then(function (val) {
          var unstableVersion = val.split('/').splice(-2,1)[0];
          for (i = 0; i < unstableVersion.split('.').length; i++) {
            if (unstableVersion.split('.')[i] > stableVersion.split('.')[i]) {
              okay = true;
              break;
            }
          }

          expect(okay).toBe(true);
        });
      });

      downloadVersions.forEach(function(version) {
        it('should have the correct version available for download', function () {
          var versionAndBranch = version.split(':'),
              branchBtnSelector = '.branch-' + versionAndBranch[1].
                      replace(/\./g, '-').
                      replace(/\*/g, 'x'),

              branchBtn = tractor.findElement(
              protractor.By.css(branchBtnSelector));
          branchBtn.click();

          expect(cdnInput.getAttribute('value')).
              toContain(versionAndBranch[0]);
        });
      });



      it('should allow downloading uncompressed angular', function () {
        var uncompressedBtn = tractor.findElement(
            protractor.By.css(
                '.download-modal .modal-body > dl button.uncompressed'));
        uncompressedBtn.click()

        expect(cdnInput.getAttribute('value')).toContain('angular.js');
      });
    });

    describe('The Basics', function () {
      it('should show the code example', function () {
        var hello = tractor.findElement(protractor.By.css('[app-source="hello.html"]'));
        expect(hello.getText()).toContain('{{yourName}}');
      });


      it('should have a hoverable region called ng-app', function () {
        var noCode = tractor.findElement(protractor.By.css('[popover-title="ng-app"]'))
        expect(noCode.getText()).toEqual('ng-app');
      });


      it('should update the Hello text after entering a name', function () {
        var el = tractor.findElement(protractor.By.input('yourName'));
        el.click()
        el.sendKeys('Jeff')

        var bound = tractor.findElement(protractor.By.css('[app-run="hello.html"] h1'));
        expect(bound.getText()).toEqual('Hello Jeff!');
      });
    });


    describe('Add Some Control', function () {
      it('should strike out a todo when clicked', function () {
        var el = tractor.findElement(protractor.By.css('[ng-controller="TodoCtrl"] ul >li:nth-child(2) input'));
        el.click();
        expect(el.getAttribute('value')).toBe('on');
      });


      it('should add a new todo when added through text field', function () {
        var el = tractor.findElement(protractor.By.input('todoText'));
        el.click();
        el.sendKeys('Write tests!');
        el.sendKeys(webdriver.Key.RETURN);

        var lastTodo = tractor.findElement(protractor.By.css('[ng-repeat="todo in todos"]:nth-child(3) span'));
        expect(lastTodo.getText()).toEqual('Write tests!');
      });


      it('should show a secondary tab when selected', function () {
        var todoJsTab = tractor.findElement(protractor.By.css('[annotate="todo.annotation"] ul.nav-tabs li:nth-child(2) a'));
        todoJsTab.click()

        var todojs = tractor.findElement(protractor.By.css('[annotate="todo.annotation"] .tab-pane:nth-child(2)'));
        expect(todojs.getCssValue('display')).toEqual('block');
      });
    });


    describe('Wire up a Backend', function () {
      it('should show a secondary tab when selected', function () {
        var listBtn = tractor.findElement(protractor.By.css('[annotate="project.annotation"] ul.nav-tabs li:nth-child(2) a'));
        listBtn.click();

        var listTab = tractor.findElement(protractor.By.css('[module="project"] .tab-pane:nth-child(2)'));
        expect(listTab.getCssValue('display')).toEqual('block');
      });
    });


    describe('Create Components', function () {
      it('should show the US localization of date', function () {
        var dateText = tractor.findElement(protractor.By.css('[module="app-us"] .tab-content > .tab-pane > span:first-child'));
        var text = dateText.getText();

        expect(text).toMatch(/^Date: [A-Za-z]*, [A-Za-z]+ [0-9]{1,2}, [0-9]{4}$/);
      });


      /*it('should show the US pluralization of beer', function () {
        var pluralTabLink = tractor.findElement(protractor.By.css('[module="app-us"] .nav-tabs > li:nth-child(2) a'));
        pluralTabLink.click()

        var pluralTab = tractor.findElement(protractor.By.css('[module="app-us"] [ng-controller="BeerCounter"] > div > ng-pluralize'));
        expect(pluralTab.getText()).toEqual('no beers');
      });


      it('should show the Slovak pluralization of beer', function () {
        var pluralTabLink = tractor.findElement(protractor.By.css('[module="app-sk"] .nav-tabs > li:nth-child(2) a'));
        pluralTabLink.click();

        var pluralTab = tractor.findElement(protractor.By.css('[module="app-sk"] [ng-controller="BeerCounter"] > div > ng-pluralize'));
        expect(pluralTab.getText()).toEqual('žiadne pivo');
      });*/
    });


    describe('Embed and Inject', function () {
      it('should have some content under and "Embeddable" heading', function () {
        var embedAndInject = tractor.findElement(protractor.By.css('#embed-and-inject'))
        expect(embedAndInject.getText()).toEqual('Embed and Inject');
      });
    });
  });
});
